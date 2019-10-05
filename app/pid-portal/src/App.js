
// @flow

import React, { Component, Fragment } from 'react'
import { Map, TileLayer, Marker, Popup, Polyline} from 'react-leaflet'
import L from 'leaflet'


var invisible_style = {
  display:'none'
};

export const pointerIcon = new L.Icon({
  iconUrl: require('./assets/icon.svg'),
  iconRetinaUrl: require('./assets/icon.svg'),
  iconAnchor: [5, 55],
  popupAnchor: [10, -44],
  iconSize: [40, 72]
  //shadowUrl: '../assets/marker-shadow.png',
  //shadowSize: [68, 95],
  //shadowAnchor: [20, 92],
})

export const StopIcon = new L.Icon({
  iconUrl: require('./assets/stop.svg'),
  iconRetinaUrl: require('./assets/stop.svg'),
  iconAnchor: [5, 55],
  popupAnchor: [10, -44],
  iconSize: [40, 72]
  //shadowUrl: '../assets/marker-shadow.png',
  //shadowSize: [68, 95],
  //shadowAnchor: [20, 92],
})



type Position = [number, number]

type Props = {|
  content: string,
  position: Position,
|}

type MarkerData = {| ...Props, key: string |}



type State = {
  markers: Array<MarkerData>,
  stops: Array<MarkerData>,
}

export default class CustomComponent extends Component<{}, State> {
  state = {
    zoomLevel : 11,
    markers: this.getItems(),
    route: [],
    stops: []
  }

  VehicleMarkersList = ({ markers }: { markers: Array<MarkerData> }) => {
    if (markers === undefined) 
    {
      const items = [];
      return <Fragment></Fragment>
    }
    else
    {
      const items = markers.map(({ key, ...props }) => (
        <this.VehiclePopupMarker key={key} {...props} />
      ))
      return <Fragment>{items}</Fragment>
    }
  }

  VehiclePopupMarker = ({ content, position }: Props) => (
    <Marker position={position} icon={pointerIcon} onClick={this.handleClick} >
      <Popup>
        <p style={invisible_style}> trip_id:"{content.trip}" </p>
        <p>Linka : {content.route_id}</p>
        <p>Bus: {content.vehicle}</p>
        <p>Vypočítané zpoždění : {content.calc_delay} minut </p>
        <p>Rychlost : {content.speed} km/h</p>
        
            <p>Timestamp: {content.timestamp}</p>
      </Popup>
    </Marker>
  )

  handleClick = event => {
    var popup = event.originalEvent.currentTarget.textContent;
    var trip_id = popup.match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, "");
    this.getRoute(trip_id);


    console.log(`Clicked at`)
  }

  itemsToMarkers(items){
     var markers = [];
    items.forEach(item => {
      markers.push({key : item['trip_id'], position : [item['latitude'], item['longitude']], content : {trip: item['trip_id'], route_id: item['route_id'],
       vehicle: item['vehicle_id'], timestamp : item['timestamp'], canceled : item['is_canceled'], speed : item['speed'], calc_delay : item['calculated_delay'], bearing: item['bearing']} });
    });
    console.log(markers);
    this.setState({markers});
  }

  StopMarkersList = ({ markers }: { markers: Array<MarkerData> }) => {
    if (markers === undefined) 
    {
      const items = [];
      return <Fragment></Fragment>
    }
    else
    {
      const items = markers.map(({ key, ...props }) => (
        <this.StopPopupMarker key={key} {...props} />
      ))
      return <Fragment>{items}</Fragment>
    }
  }

  StopPopupMarker = ({ content, position }: Props) => (
    <Marker position={position} icon={StopIcon}>
      <Popup>
        <p style={invisible_style}> trip_id:"{content.trip}" </p>
        <p>Linka : {content.route_id}</p>
        <p>Bus: {content.vehicle}</p>
        <p>Vypočítané zpoždění : {content.calc_delay} minut </p>
        <p>Rychlost : {content.speed} km/h</p>
        
            <p>Timestamp: {content.timestamp}</p>
      </Popup>
    </Marker>
  )

  handleClick = event => {
    var popup = event.originalEvent.currentTarget.textContent;
    var trip_id = popup.match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, "");
    this.getRoute(trip_id);


    console.log(`Clicked at`)
  }




/*
  {
    route_id: 'L2',
    order: '1',
    distance: 0,
    latitude: 50.09397,
    longitude: 14.33671,
    stop_id: '',
    trip_id: '2_68_190902',
    shape_id: 'L1V1',
    direction: true,
    bikes_allowed: false,
    headsign: 'Sídliště Petřiny'
  },
*/

  processRoute(route_points){
    var route = [];

    route_points.forEach(point => {
      route.push([point['latitude'], point['longitude']])
      if(point['stop_id'] !== '')
      {
        this.getStop(point['stop_id']);
      }
    })
    this.setState({route})
  }

  getStop(stop_id){
    console.log('loading stop')
    fetch('http://localhost:3000/getStop/' + stop_id
  ).then(response => response.json())
  .then(items => this.addStopOnMap(items))
  .catch(err => console.log(err))
  }
  

  /*
    {
    name: 'příměstské linky PID',
    latitude: 50.12539,
    longitude: 14.51575,
    zone_id: '',
    wheelchair_acc: false,
    stop_id: 'U1000S1E12'
  }
  */ 
  addStopOnMap(stop){
    var stops = this.state.stops;
    if(stop.length === 1)
    {
      var oneStop = stop[0];
      stops.push( {key : oneStop['stop_id'], position : [oneStop['latitude'], oneStop['longitude']], content : {name : oneStop['name'], zone_id : oneStop['zone_id'], wheelchair_acc : oneStop['wheelchair_acc']}} )
    }
    this.setState({stops});
  }

  getRoute(trip_id){
    console.log('loading route')
    fetch('http://localhost:3000/getRouteForTrip/'+trip_id)
  .then(response => response.json())
  .then(items => this.processRoute(items))
  .catch(err => console.log(err))
  }

getItems(){
  console.log('loading items');
  fetch('http://localhost:3000/getLastVehiclePositions')
  .then(response => response.json())
  .then(items => this.itemsToMarkers(items))
  .catch(err => console.log(err))
}

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({ time: Date.now() });
      this.getItems();
    }, 20000);
    
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handlePopupClose = (e) => {
    var stops = []
    var route = []
    this.setState({stops, route})
  }

  render() {
    return (
      <Map center={[50.0753564, 14.4408661]} zoomControl={false} zoom={this.state.zoomLevel} onPopupClose={this.handlePopupClose}>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <this.VehicleMarkersList markers={this.state.markers} />
        <this.StopMarkersList markers={this.state.stops} />
        <Polyline color="lime" positions={this.state.route} />
      </Map>
    )
  }
}