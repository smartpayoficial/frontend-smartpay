/*
This is a simplified and partial GeoJSON FeatureCollection. 
The coordinates do not represent the actual borders of the countries and are simple rectangles for demonstration purposes.
For a real-world application, replace this with a complete and accurate GeoJSON file of world countries.
*/
export const world_countries = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Peru"
            },
            "id": "PER",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-81.3, -0.0],
                        [-68.7, -0.0],
                        [-68.7, -18.3],
                        [-81.3, -18.3],
                        [-81.3, -0.0]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Ecuador"
            },
            "id": "ECU",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-81.0, 1.4],
                        [-75.2, 1.4],
                        [-75.2, -5.0],
                        [-81.0, -5.0],
                        [-81.0, 1.4]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Colombia"
            },
            "id": "COL",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-79.0, 12.5],
                        [-66.8, 12.5],
                        [-66.8, -4.2],
                        [-79.0, -4.2],
                        [-79.0, 12.5]
                    ]
                ]
            }
        }
    ]
};