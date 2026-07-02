from flask import Flask, request, jsonify
from sklearn.cluster import KMeans
import numpy as np
import json
import urllib.request
from flask_cors import CORS
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import time
import traceback

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:5174"}})

# K-Means clustering model (in-memory)
kmeans_model = None

@app.route('/api/cluster', methods=['POST'])
def cluster_locations():
    """
    Cluster pickup/dropoff locations using K-Means
    
    Expected JSON:
    {
        "locations": [
            {"latitude": 23.1815, "longitude": 79.9864, "id": 1},
            ...
        ],
        "n_clusters": 3
    }
    """
    try:
        data = request.json
        locations = data.get('locations', [])
        n_clusters = data.get('n_clusters', 3)
        
        if len(locations) < n_clusters:
            n_clusters = len(locations)
        
        # Extract coordinates
        coords = np.array([[loc['latitude'], loc['longitude']] for loc in locations])
        
        # Fit K-Means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
        
        # Format response
        clusters = {}
        for idx, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append({
                'id': locations[idx].get('id'),
                'latitude': locations[idx]['latitude'],
                'longitude': locations[idx]['longitude']
            })
        
        return jsonify({
            'status': 'success',
            'clusters': clusters,
            'centroids': kmeans.cluster_centers_.tolist()
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/match-riders', methods=['POST'])
def match_riders():
    """
    Match riders to drivers based on route proximity
    
    Expected JSON:
    {
        "driver": {
            "id": 1,
            "start": {"lat": 23.1815, "lon": 79.9864},
            "end": {"lat": 23.1925, "lon": 79.9864}
        },
        "riders": [
            {
                "id": 1,
                "pickup": {"lat": 23.1820, "lon": 79.9865},
                "dropoff": {"lat": 23.1920, "lon": 79.9865}
            }
        ]
    }
    """
    try:
        data = request.json
        driver = data.get('driver')
        riders = data.get('riders', [])
        
        matches = []
        
        for rider in riders:
            # Simple distance-based matching
            pickup_dist = haversine(
                driver['start']['lat'], driver['start']['lon'],
                rider['pickup']['lat'], rider['pickup']['lon']
            )
            dropoff_dist = haversine(
                driver['end']['lat'], driver['end']['lon'],
                rider['dropoff']['lat'], rider['dropoff']['lon']
            )
            
            # Accept if detour is less than 20% of original route
            total_dist = haversine(
                driver['start']['lat'], driver['start']['lon'],
                driver['end']['lat'], driver['end']['lon']
            )
            
            detour = pickup_dist + dropoff_dist
            if detour <= total_dist * 1.2:
                matches.append({
                    'rider_id': rider['id'],
                    'compatibility_score': (100 - (detour / (total_dist * 1.2) * 100)),
                    'detour_distance': round(detour, 2)
                })
        
        # Sort by compatibility
        matches = sorted(matches, key=lambda x: x['compatibility_score'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'driver_id': driver['id'],
            'matched_riders': matches
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/optimize-route', methods=['POST'])
def optimize_route():
    """
    Optimize route using Google OR-Tools Routing Solver
    
    Returns ONLY the optimized pickup sequence.
    All statistics and routing will be handled by the frontend.
    
    Expected JSON:
    {
        "locations": [
            {"id": "start", "lat": 23.1815, "lon": 79.9864},
            {"id": "stop1", "lat": 23.1820, "lon": 79.9865},
            {"id": "stop2", "lat": 23.1925, "lon": 79.9864},
            {"id": "end", "lat": 23.1930, "lon": 79.9870}
        ]
    }
    """
    try:
        start_time = time.time()
        data = request.json
        locations = data.get('locations', [])
        
        if len(locations) < 2:
            return jsonify({'status': 'error', 'message': 'At least 2 locations required'}), 400
        
        n_locations = len(locations)
        distance_matrix = []
        for i in range(n_locations):
            row = []
            for j in range(n_locations):
                if i == j:
                    row.append(0)
                else:
                    dist = haversine(
                        locations[i]['lat'], locations[i]['lon'],
                        locations[j]['lat'], locations[j]['lon']
                    )
                    row.append(int(dist * 1000))  # Convert to meters for OR-Tools
            distance_matrix.append(row)
        
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix),
            1,
            [0],
            [len(distance_matrix) - 1]
        )
        
        routing = pywrapcp.RoutingModel(manager)
        
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        solution = routing.SolveWithParameters(search_parameters)
        solver_time_ms = int((time.time() - start_time) * 1000)
        
        if solution:
            index = routing.Start(0)
            route_indices = []
            while not routing.IsEnd(index):
                route_indices.append(manager.IndexToNode(index))
                index = solution.Value(routing.NextVar(index))
            route_indices.append(manager.IndexToNode(index))

            optimized_waypoints = [locations[idx] for idx in route_indices]
            optimized_sequence = [locations[idx]['id'] for idx in route_indices]

            return jsonify({
                'status': 'success',
                'optimized_sequence': optimized_sequence,
                'optimized_waypoints': optimized_waypoints,
                'solver_time_ms': solver_time_ms,
                'solver': 'Google OR-Tools',
                'algorithm': 'PATH_CHEAPEST_ARC'
            }), 200
        else:
            return jsonify({'status': 'error', 'message': 'No solution found'}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates in km
    """
    from math import radians, cos, sin, asin, sqrt
    
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
