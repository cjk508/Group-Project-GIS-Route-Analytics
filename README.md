# GIS-Route-Analysis
We developed an application built upon the [OpenGeo Boundless Suite](http://boundlessgeo.com/solutions/) for Geographical Information Systems (GIS). This project was set by [Thales](https://www.thalesgroup.com/en) on behalf of the [University of York](http://cs.york.ac.uk).

## Product Description

This application was developed to provide a method of analysing the performance of emergency response vehicles using their GPS data and the emergencies they were responding to. This inspired the idea of a product line that encapsulated analytics for couriers, taxi companies and many other vehicle based services.

The application provides geographical information over response jurisdictions according to customisable metrics. Users can select a grouping of routes for generalised data or drill down to individual routes and even individual legs of routes for more specific data. The statistics manager provides these value and attempts to estimate the length of time that the route should have taken under optimal conditions. This means that the journeys can be colour coordinated based on how long the driver took to complete them. This allows the analysist to identify areas within their jurisdiction that decrease performance and even peak times that a road is busy.

We only had 4 weeks to develop this software and therefore there is a lot of shallow or missing functionality. One key element that is missing from the application is the Data Preprocessor, this algorithm ideally would be able to take inputs of specific, but wide ranging, file types and interpret that data for insertion into our application. This could even allow for near live data to be added to the system. However, if this were the case the application would need to be significantly more robust.

## System Architecture
![Describes the 3 layer architecture that was implemented. The presentation consists of just the web application. The business layer  ](https://github.com/cjk508/Group-Project-GIS-Route-Analytics/raw/master/images/Architecture.png "System Architecture 3 Layer design")
