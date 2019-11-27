
// @flow

import React, { Component, Fragment } from 'react'
import { Map, TileLayer, Marker, Popup, Polyline, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import Dock from 'react-dock'
import { Button, Tooltip, Container, ListGroup, Col, Row, Table } from 'react-bootstrap'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as Tooltip_rechart, Legend,
} from 'recharts';
import MarkerClusterGroup from 'react-leaflet-markercluster';


const data = [
  {
    name: 'Pondělí', delay: 5,
  },
  {
    name: 'Úterý', delay: 10,
  },
  {
    name: 'Středa', delay: 25,
  },
  {
    name: 'Čtvrtek', delay: 70,
  },
  {
    name: 'Pátek', delay: 8,
  },
  {
    name: 'Sobota', delay: 11,
  },
  {
    name: 'Neděle', delay: 0,
  },
];


var invisible_style = {
  display: 'none',
  "opacity": 0
};

var visible_style = {};

export const pointerIcon = new L.Icon({
  iconUrl: require('./assets/bus.svg'),
  iconRetinaUrl: require('./assets/bus.svg'),
  iconAnchor: [5, 55],
  popupAnchor: [10, -44],
  iconSize: [20, 36]
  //shadowUrl: '../assets/marker-shadow.png',
  //shadowSize: [68, 95],
  //shadowAnchor: [20, 92],
})

export const StopIcon = new L.Icon({
  iconUrl: require('./assets/bus-stop.svg'),
  iconRetinaUrl: require('./assets/bus-stop.svg'),
  iconAnchor: [5, 55],
  popupAnchor: [10, -44],
  iconSize: [30, 54]
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
    mapCenter: [50.0753564, 14.4408661],
    zoomLevel: 11,
    markers: this.getItems(),
    route: [],
    stops: [],
    selectedPosition: "",
    dockVisible: false,
    vehiclesHidden: false,
    selected_trip: ""
  }

  VehicleMarkersList = ({ markers, hidden, selected }: { markers: Array<MarkerData>, hidden: Boolean, selected: string }) => {
    if (markers === undefined) {
      const items = [];
      return <Fragment></Fragment>
    }
    else {
      if (hidden) {
        markers = markers.filter((elem) => {
          return elem.content.trip === selected
        });
      }
      const items = markers.map(({ key, ...props }) => (
        <this.VehiclePopupMarker key={key} {...props} />
      ))
      return <Fragment>{items}</Fragment>
    }
  }

  VehiclePopupMarker = ({ content, position }: Props) => (
    <Marker position={position} icon={pointerIcon} onClick={this.handleClick} trip_id={content.trip}>
      <Tooltip>
        <p style={invisible_style}> trip_id:"{content.trip}" </p>
        <p>Linka : {content.route_id}</p>
        <p>Bus: {content.vehicle}</p>
        <p>Vypočítané zpoždění : {content.calc_delay} minut </p>
        <p>Rychlost : {content.speed} km/h</p>

        <p>Timestamp: {content.timestamp}</p>
      </Tooltip>
    </Marker>
  )

  itemsToMarkers(items) {
    var markers = [];
    items.forEach(item => {
      markers.push({
        key: item['trip_id'], position: [item['latitude'], item['longitude']], content: {
          trip: item['trip_id'], route_id: item['route_id'],
          vehicle: item['vehicle_id'], timestamp: item['timestamp'], canceled: item['is_canceled'], speed: item['speed'], calc_delay: item['calculated_delay'], bearing: item['bearing']
        }
      });
    });
    console.log(markers);
    this.setState({ markers });
  }

  StopMarkersList = ({ markers }: { markers: Array<MarkerData> }) => {
    if (markers === undefined) {
      const items = [];
      return <Fragment></Fragment>
    }
    else {
      const items = markers.map(({ key, ...props }) => (
        <this.StopPopupMarker key={key} {...props} />
      ))
      return <Fragment>{items}</Fragment>
    }
  }

  StopPopupMarker = ({ content, position }: Props) => (
    <Marker position={position} icon={StopIcon}>
      <Popup>
        <p>Název : {content.name}</p>
        <p>Bezbariérová: {content.wheelchair_acc ? "Ano" : "Ne"}</p>
        <p>Zóna : {content.zone_id}</p>
      </Popup>
    </Marker>
  )

  DockContent = () => (
    <Container>
      <Row>
      <Col>
      <ListGroup>
        <ListGroup.Item as="li">Prev Stop</ListGroup.Item>
        <ListGroup.Item as="li" active>Current Stop</ListGroup.Item>
        <ListGroup.Item as="li">Next Stop</ListGroup.Item>
      </ListGroup>
      </Col>
      <Col>
      <Table striped bordered hover>
      <tbody>
    <tr>
      <td>Linka</td>
      <td>428</td>
    </tr>
    <tr>
      <td>Aktuální zpoždění</td>
      <td>10 minut</td>
    </tr>
    <tr>
      <td>Provozovatel</td>
      <td>ČSAD</td>
    </tr>
    <tr>
      <td>Vozidlo</td>
      <td>123465</td>
    </tr>
    <tr>
      <td>Bezbariérová</td>
      <td>Ano</td>
    </tr>
    </tbody>
        </Table>      
      </Col>
      <Col>
      <BarChart width={600} height={250} data={data}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="name"/>
       <YAxis/>
       <Tooltip_rechart/>
       <Legend />
       <Bar dataKey="delay" label={{ position: 'top' }} >
       {
            data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={this.getColorByValue(entry.delay)}/>
            ))
          }
       </Bar>
      </BarChart>
      </Col>
      </Row>
      </Container>
  )

  getColorByValue(value)
  {
    if(value <= 10)
    {
      return "#1AAB00";
    }
    if(value <= 60)
    {
      return "#FCBA3E";
    }
    return "#FF2D00";
  }

  processRoute(route_points) {
    var route = [];

    route_points.forEach(point => {
      route.push([point['latitude'], point['longitude']])
    })
    this.setState({ route })
  }

  getStops(stop_id) {
    console.log('loading stop')
    fetch('http://localhost:3000/getStopForTrip/' + stop_id
    ).then(response => response.json())
      .then(items => this.addStopsOnMap(items))
      .catch(err => console.log(err))
  }


  addStopsOnMap(stop_json) {
    var stops = [];
    stop_json.forEach(stop => {
      stops.push({ key: stop['stop_id'], position: [stop['latitude'], stop['longitude']], content: { name: stop['name'], zone_id: stop['zone_id'], wheelchair_acc: stop['wheelchair_acc'] } })
    });
    this.setState({ stops });
  }

  getRoute(trip_id) {
    console.log('loading route')
    fetch('http://localhost:3000/getRouteForTrip/' + trip_id)
      .then(response => response.json())
      .then(items => this.processRoute(items))
      .catch(err => console.log(err))
  }

  getItems() {
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

  handleClick = event => {

    var mapCenter = event.target.options.position;
    var selected_trip = event.target.options.trip_id;
    var vehiclesHidden = true;
    var dockVisible = this.state.dockVisible;
    if (dockVisible === true) {
      dockVisible = false;
      this.setState({ dockVisible });
    }
    dockVisible = true;
    this.getRoute(selected_trip);
    this.getStops(selected_trip);

    this.setState({ dockVisible, vehiclesHidden, selected_trip, mapCenter });

    console.log(`Clicked at`)
  }


  handlePopupClose = (e) => {
    var stops = []
    var route = []
    var dockVisible = false;
    var vehiclesHidden = false;
    var selected_trip = "";
    this.setState({ stops, route, dockVisible, vehiclesHidden, selected_trip })
  }

  render() {
    return (
      <Map center={this.state.mapCenter} zoomControl={false} zoom={this.state.zoomLevel} maxZoom='15'>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayerGroup>
          <MarkerClusterGroup>
          <this.VehicleMarkersList markers={this.state.markers} hidden={this.state.vehiclesHidden} selected={this.state.selected_trip} />
          </MarkerClusterGroup>
        </LayerGroup>
        <LayerGroup >
          <this.StopMarkersList markers={this.state.stops} />
          <Polyline color="lime" positions={this.state.route} />
        </LayerGroup>
        <Dock position='bottom' isVisible={this.state.dockVisible} dimMode='none'>
          <Button variant="danger" style={{ float: 'right' }} onClick={this.handlePopupClose}>X</Button>
          {this.DockContent()}

        </Dock>
      </Map>

    )
  }
}