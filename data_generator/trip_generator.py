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
import polyline_utils
import datetime

API_KEY = "AIzaSyCOKsKPLwPUp9Jp_t1EwMaeqMILPs9evCs"
API_CALL_PATTERN = "https://maps.googleapis.com/maps/api/directions/json?origin={0}&destination={1}&key={2}"
START_DATE = datetime.datetime(2015,03,1, 0,4,5)

def read_points(fileName):
    lines = []
    with open(fileName, 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for i in reader:
            lines.append(i)    
    return lines

def generate_trip_data(origin, destination, service_id, trip_id, timestamp):
    response = requests.get(API_CALL_PATTERN.format(format_lat_lon(origin), format_lat_lon(destination), API_KEY))
    s = response.json()
    
    recalculated_steps, lag = flatten_steps_with_lag(s['routes'][0]['legs'][0]['steps'], trip_id)
    trip_overview = collections.OrderedDict()
    
    trip_overview['service_id'] = service_id
    trip_overview['trip_id'] = trip_id
    trip_overview['time_dispatch'] = timestamp
    trip_overview['time_sec_delayed'] = lag - s['routes'][0]['legs'][0]['duration']['value']
    trip_overview['time_arrival'] = timestamp + datetime.timedelta(seconds=lag)
    trip_overview['distance_meters'] = s['routes'][0]['legs'][0]['distance']['value']
    trip_overview['lineString'] = decodedPolylineToLineString(s['routes'][0]['overview_polyline']['points'])
    
    return trip_overview, recalculated_steps

def decodedPolylineToLineString(polyline):
    arrayOfTuples = polyline_utils.decode(polyline)
    lineString = ""
    for tuple in arrayOfTuples:
         lineString += "," + str(tuple[0]) + " " + str(tuple[1])
    
    return "LINESTRING(\"" + lineString[1:len(lineString)] + "\")"
     
def format_lat_lon(lat_lon_tuple):
    return lat_lon_tuple[0] + "," + lat_lon_tuple[1]

def flatten_steps_with_lag(steps, trip_id):
    steps_new = []
    total_lag = 0
    step_num = 0
    for step in steps:
        step_new = collections.OrderedDict()
        step_new['trip_id'] = trip_id
        step_new['step_num'] = step_num
        step_new['distance_meters'] = step['distance']['value']
        step_new['time_delay'] = int(step['duration']['value']) + random_lag_generator() - step['duration']['value']
        step_new['lineString'] = decodedPolylineToLineString(step['polyline']['points'])
        total_lag += int(step['duration']['value']) + random_lag_generator()
 
        steps_new.append(step_new)
        step_num += 1
        
    return steps_new, total_lag

def random_lag_generator():
    return random.randint(0, 200)

def random_dispatch_generator():
    return random.randint(60, 180)


if __name__ == '__main__':
    
    trips = read_points("../data/100random_points.csv")
    overview = []
    steps = []
    service_guid = uuid.uuid4()
    with open('../data/overview.csv', 'wb') as overview_file, open('../data/steps.csv', 'wb') as steps_file:
        
        for i in xrange(0, len(trips), 2):
            if ((i % 10) == 0):
                service_guid = uuid.uuid4()
            
            trip_guid = uuid.uuid4()
            
            timestamp = START_DATE + datetime.timedelta(minutes=random_dispatch_generator())
            START_DATE = timestamp
            overview, steps = generate_trip_data((trips[i][1], trips[i][3]),(trips[i+1][1], trips[i+1][3]), service_guid, trip_guid, timestamp)
            if i == 0:
                ov = csv.DictWriter(overview_file, overview.keys())
                ov.writeheader()
                st = csv.DictWriter(steps_file, steps[0].keys())
                st.writeheader()
                
            ov.writerow(overview)
            st.writerows(steps)
            time.sleep(0.5)
            