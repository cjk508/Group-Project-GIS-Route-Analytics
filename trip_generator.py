'''
Created on 17 May 2015

@author: Zhivko Georgiev
'''
import requests
import csv
import json
import random
import uuid
import collections
import time

API_KEY = "AIzaSyCOKsKPLwPUp9Jp_t1EwMaeqMILPs9evCs"
API_CALL_PATTERN = "https://maps.googleapis.com/maps/api/directions/json?origin={0}&destination={1}&key={2}"

def read_points(fileName):
    lines = []
    with open(fileName, 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for i in reader:
            lines.append(i)    
    return lines

def generate_trip_data(origin, destination, service_id, trip_id):
    response = requests.get(API_CALL_PATTERN.format(format_lat_lon(origin), format_lat_lon(destination), API_KEY))
    s = response.json()
    
    recalculated_steps, lag = flatten_steps_with_lag(s['routes'][0]['legs'][0]['steps'], trip_id)
    trip_overview = collections.OrderedDict()
    
    trip_overview['service_id'] = service_id
    trip_overview['trip_id'] = trip_id
    trip_overview['origin_lat'] = origin[0]
    trip_overview['origin_lon'] = origin[1]
    trip_overview['destination_lat'] = destination[0]
    trip_overview['destination_lon'] = destination[1]
    
    trip_overview['time_sec_taken'] = lag
    trip_overview['time_sec_optimal'] = s['routes'][0]['legs'][0]['duration']['value']
    trip_overview['distance_meters'] = s['routes'][0]['legs'][0]['distance']['value']
    trip_overview['polyline'] = s['routes'][0]['overview_polyline']['points']
    
    return trip_overview, recalculated_steps
    
def format_lat_lon(lat_lon_tuple):
    return lat_lon_tuple[0] + "," + lat_lon_tuple[1]

def flatten_steps_with_lag(steps, trip_id):
    steps_new = []
    total_lag = 0;
    for step in steps:
        step_new = collections.OrderedDict()
        step_new['trip_id'] = trip_id
        step_new['distance_meters'] = step['distance']['value']
        step_new['duration_sec_taken'] = int(step['duration']['value']) + random_lag_generator()
        step_new['duration_sec_optimal'] = step['duration']['value']
        step_new['origin_lat'] = step['start_location']['lat']
        step_new['origin_lon'] = step['start_location']['lng']
        step_new['destination_lat'] = step['end_location']['lat']
        step_new['destination_lon'] = step['end_location']['lng']
        step_new['polyline'] = step['polyline']['points']
        total_lag += step_new['duration_sec_taken']
        
        steps_new.append(step_new)
    return steps_new, total_lag
def random_lag_generator():
    return random.randint(0, 600)

if __name__ == '__main__':
    
    trips = read_points("100random_points.csv")
    overview = []
    steps = []
    service_guid = uuid.uuid4()
    with open('overview.csv', 'wb') as overview_file, open('steps.csv', 'wb') as steps_file:
        
        for i in xrange(0, len(trips), 2):
            if ((i % 10) == 0):
                service_guid = uuid.uuid4()
            
            trip_guid = uuid.uuid4()
            overview, steps = generate_trip_data((trips[i][1], trips[i][3]),(trips[i+1][1], trips[i+1][3]), service_guid, trip_guid)
            if i == 0:
                ov = csv.DictWriter(overview_file, overview.keys())
                ov.writeheader()
                st = csv.DictWriter(steps_file, steps[0].keys())
                st.writeheader()
                
            ov.writerow(overview)
            st.writerows(steps)
            time.sleep(0.5)
            