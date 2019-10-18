
// @flow

import React, { Component, Fragment } from 'react'
import { Map, TileLayer, Marker, Popup, Polyline, LayerGroup} from 'react-leaflet'
import L from 'leaflet'


var invisible_style = {
  display:'none',
  "opacity":0
};

var visible_style = {};

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
  selectedPosition: MarkerData
}

export default class CustomComponent extends Component<{}, State> {
  state = {
    zoomLevel : 11,
    markers: this.getItems(),
    route: [],
    stops: [],
    selectedPosition : "",
    vehicleMarkerStyle : visible_style,
    stopMarkerStyle : invisible_style,
    routeMarkerStyle: invisible_style
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
    
    var vehicleMarkerStyle = invisible_style;
    var stopMarkerStyle = visible_style;
    var routeMarkerStyle = visible_style;
    this.getRoute(trip_id);
    this.getStops(trip_id);

    this.setState({vehicleMarkerStyle, stopMarkerStyle, routeMarkerStyle});

    console.log(`Clicked at`)
  }

  processRoute(route_points){
    var route = [];

    route_points.forEach(point => {
      route.push([point['latitude'], point['longitude']])
    })
    this.setState({route})
  }

  getStops(stop_id){
    console.log('loading stop')
    fetch('http://localhost:3000/getStopForTrip/' + stop_id
  ).then(response => response.json())
  .then(items => this.addStopsOnMap(items))
  .catch(err => console.log(err))
  }
  

  addStopsOnMap(stop_json){
    var stops = [];
    stop_json.forEach(stop =>
    {
      stops.push( {key : stop['stop_id'], position : [stop['latitude'], stop['longitude']], content : {name : stop['name'], zone_id : stop['zone_id'], wheelchair_acc : stop['wheelchair_acc']}} )
    });
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
    var vehicleMarkerStyle = visible_style;
    var stopMarkerStyle = invisible_style;
    var routeMarkerStyle = invisible_style;
    this.setState({stops, route, vehicleMarkerStyle, stopMarkerStyle, routeMarkerStyle})
  }

  render() {
    return (
      <Map center={[50.0753564, 14.4408661]} zoomControl={false} zoom={this.state.zoomLevel} onPopupClose={this.handlePopupClose}>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayerGroup style={this.state.vehicleMarkerStyle}>
        <this.VehicleMarkersList markers={this.state.markers}  />
        </LayerGroup>
        <LayerGroup style={this.state.stopMarkerStyle}>
        <this.StopMarkersList markers={this.state.stops}  />
        <Polyline color="lime" positions={this.state.route}  style={this.state.routeMarkerStyle}/>
        </LayerGroup>

      </Map>
    )
  }
}