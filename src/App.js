import { useRef, useEffect, useState } from 'react'
import * as tt from '@tomtom-international/web-sdk-maps' // 6.15.0
import * as ttapi from '@tomtom-international/web-sdk-services' // 6.15.0
import './App.css'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

const  App = () => {  
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [latitude, setLatitude] = useState(21.1236)
  const [longitude, setLongitude] = useState(-101.68)

  const ConvertToPoints = (lngLat) => {
    return {
      point: {
        latitude: lngLat.lat,
        longitude: lngLat.lng
      }
    }
  } 
  const drawRoute = (geoJson, map) => { // Esto dibuja la línea de la ruta ya calculada
    if (map.getLayer('route')){
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson', 
        data: geoJson
      },
      paint: {
        'line-color' : 'purple',
        'line-width' : 3
      }
    })
  }

  const addMarker2 = (lngLat, map) => {
    const element = document.createElement('div')
      element.className = 'marker'
      new tt.Marker({
        element: element
      })
      .setLngLat(lngLat)
      .addTo(map)
  }

  useEffect (()=> {
    const origin = {
      lng: longitude,
      lat: latitude,
    }
    const destinations = [];

    let map = tt.map({
      key: 'FWQcuCT1v2OQdZIZVuyL8GF0xMpar2Zq',
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true
      },
      center: [longitude , latitude],
      zoom: 14
    })

    setMap(map);

    const addMarker = () => {
      const element = document.createElement('div')
      element.className = 'marker'

      const marker = new tt.Marker({
       draggable: true,
        element: element,
      })
        .setLngLat([longitude, latitude])
        .addTo(map)
      
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLongitude(lngLat.lng)
        setLatitude(lngLat.lat)
      })
    }
    addMarker()

    const OrderDes = (locations) => {
      const pointsDistance = locations.map((destination) => {
        return ConvertToPoints(destination)  
      })
      const callParameters = {
        key: 'FWQcuCT1v2OQdZIZVuyL8GF0xMpar2Zq',
        destinations: pointsDistance , // Esto calcula las distancias entre los puntos
        origins: [ConvertToPoints(origin)],
      }
      return new Promise((resolve, reject) => {
        ttapi.services
        .matrixRouting(callParameters) // Esta línea crea el matrix routing
        .then((matrixAPIresults) => {
          const results = matrixAPIresults.matrix[0]
          const resultsArray = results.map((result, index) => {
            return {
              location : locations[index],
              drivingtime: result.response.routeSummary.travelTimeInSeconds
            }
          })
          resultsArray.sort((x,y) => {
            return x.drivingtime - y.drivingtime
          })
          const orderLoc =  resultsArray.map((result) => {
            return result.location
          })
          resolve(orderLoc)
        })
      })
    }
    // sacar segundos
    const recalculateRoutes = () => {
      OrderDes(destinations).then((sorted) => {
        sorted.unshift(origin)

        ttapi.services
        .calculateRoute({
          key: 'FWQcuCT1v2OQdZIZVuyL8GF0xMpar2Zq',
          locations: sorted, 
        })
        .then((routeData) => {
          const geoJson = routeData.toGeoJson()
          drawRoute(geoJson, map)
        })
      })
    }

    map.on('click', (e) => {
      destinations.push(e.lngLat)
      addMarker2(e.lngLat, map)
      recalculateRoutes()
    })

    return () => map.remove()
  }, [longitude, latitude])
  
  return (
    <div className="app">
      <div ref={mapElement} className="map"/>
      {/* Estos inputs ponen el primer punto de manera manual */}
      <div className="search">
        <input 
          type="text" 
          className="lat"
          id="lat"
          placeholder="Latitud"
          onChange= {(e) => { setLatitude (e.target.value)}}
        />
        <input 
          type="text" 
          className="long"
          id="long"
          placeholder="Longitud"
          onChange= {(e) => { setLongitude (e.target.value)}}
        />
      </div>
    </div>
  )
}

export default App;