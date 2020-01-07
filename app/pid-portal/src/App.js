
// @flow

import React, { Component, Fragment } from 'react'
import { Map, TileLayer, Marker, Popup, Polyline, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import Dock from 'react-dock'
import { Button, Tooltip, Container, ListGroup, Col, Row, Table, Modal, Spinner} from 'react-bootstrap'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as Tooltip_rechart, Legend, Label
} from 'recharts';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { isEmptyStatement } from '@babel/types'
import { slide as Menu } from 'react-burger-menu'


const host = "localhost";

var invisible_style = {
  display: 'none',
  "opacity": 0
};

var visible_style = {};

export const pointerIcon = new L.Icon({
  iconUrl: require('./assets/bus.svg'),
  iconRetinaUrl: require('./assets/bus.svg'),
  iconAnchor: [10, 18],
  popupAnchor: [10, -44],
  iconSize: [20, 36]
  //shadowUrl: '../assets/marker-shadow.png',
  //shadowSize: [68, 95],
  //shadowAnchor: [20, 92],
})

export const StopIcon = new L.Icon({
  iconUrl: require('./assets/bus-stop.svg'),
  iconRetinaUrl: require('./assets/bus-stop.svg'),
  iconAnchor: [0, 54],
  popupAnchor: [10, -44],
  iconSize: [30, 54]
  //shadowUrl: '../assets/marker-shadow.png',
  //shadowSize: [68, 95],
  //shadowAnchor: [20, 92],
})

function MydModalWithTable(props) {
  var renderSection = (section, index) => {
    return (
      <tr key={index}>
        <td>{section.source}</td>
        <td>{section.destination}</td>
        <td>{section.avg_delay}</td>
      </tr>
    )
  }
  return (
    <Modal {...props} aria-labelledby="contained-modal-title-vcenter" size="lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter" style={{color:'black'}}>
          Přehled úseků podle zpoždění 
          (100 úseků s nejvyšším průměrných zpožděním)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
        <Table striped condensed hover>
  <thead>
    <tr>
      <th>Počáteční zastávka</th>
      <th>Cílová zastávka</th>
      <th>Průměrné zpoždění (s)</th>
    </tr>
  </thead>
  <tbody>
    {props.badSections.map(renderSection)}
  </tbody>
</Table>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Zavřít</Button>
      </Modal.Footer>
    </Modal>
  );
}

function MydModalWithGrid(props) {
  var getColorByValue = (value) =>
  {
    if(value === undefined)
    {
      return;
    }
    if(value.avg <= 60)
    {
      return "#1AAB00";
    }
    if(value.avg <= 180)
    {
      return "#FCBA3E";
    }
    return "#FF2D00";
  }
  
  var minuteFormater = (value) =>
  {
    return value + " s";
  }

  return (
    <Modal {...props} aria-labelledby="contained-modal-title-vcenter" size="lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter" style={{color:'black'}}>
          Histogramy zpoždění
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row style={{display: props.dataLoading, color:'black'}}> <Spinner animation="border"  variant="dark"/> Načítání ...</Row>
          <Row style={{color:'black'}}>
            Zpoždění během dne po hodinách
            </Row>
            <Row>
        <BarChart width={700} height={250} data={props.dataByHour}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="hour">
       <Tooltip_rechart  />
         </XAxis>
       <YAxis/>
       <Tooltip_rechart formatter={(value) => minuteFormater(value)}/>
       <Bar dataKey="avg" name='Zpoždění během dne' formatter={(value) => minuteFormater(value)} > 
         {  
          props.dataByHour.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColorByValue(entry)}/>
          ))
          }
       </Bar>
      </BarChart>
      </Row>
      <Row style={{color:'black'}}>
        Zpoždění po jednotlivých dnech v týdnu
        </Row>
        <Row>
      <BarChart width={700} height={250} data={props.dataByDay}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="day">
       <Tooltip_rechart formatter={(value) => minuteFormater(value)} />
         </XAxis>
       <YAxis/>
       <Tooltip_rechart/>


       <Bar dataKey="avg" name='Zpoždění za dny v týdnu' formatter={(value) => minuteFormater(value)}>
         {
            props.dataByDay.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColorByValue(entry)}/>
            ))
          }
       </Bar>
      </BarChart>
      </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Zavřít</Button>
      </Modal.Footer>
    </Modal>
  );
}

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
    selected_trip: "",
    selected_trip_data : {},
    selected_trip_stops : {},
  
    selected_trip_stop_delays : {},
    selected_trip_stats : [],
    selected_trip_vehicle : {},
    modalShow : false,
    setModalShow : false,
    modalShow_sections : false,
    setModalShow_sections : false,
    dataByHour : [],
    dataByDay:[],
    badSections:[],
    dataLoading : 'initial'
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
        <p>Vypočítané zpoždění : {content.calc_delay} s </p>
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
        <p>Čas příjezdu: {content.arival_time}</p>
        <p>Čas odjezdu: {content.departure_time}</p>
        <p>Bezbariérová: {content.wheelchair_acc ? "Ano" : "Ne"}</p>
        <p>Zóna : {content.zone_id}</p>
      </Popup>
    </Marker>
  )

  DockContent = () => (
    <Container>
      <Row>
      <Col md="auto">
      <ListGroup.Item as="li"></ListGroup.Item>
      <ListGroup variant="flush">
  <ListGroup.Item as="li" active>{this.getNextStop()}</ListGroup.Item>
        <ListGroup.Item as="li">{this.getNextNextStop()}</ListGroup.Item>
      </ListGroup>
      </Col>
      <Col md="auto">
      <Table responsive striped bordered size="sm" responsive="sm" >
      <tbody>
    <tr>
      <td>Linka</td>
  <td>{this.state.selected_trip_data.route_id !== undefined ? this.state.selected_trip_data.route_id.replace('L','') : "Chybí data"}</td>
    </tr>
    <tr>
      <td>Změřené zpoždění</td>
      <td>{this.state.selected_trip_data.calculated_delay !== undefined ? this.state.selected_trip_data.calculated_delay + ' s' : "Chybí data"} </td>
    </tr>
    <tr>
      <td>Zpoždění na další zastávce</td>
      <td>{this.state.selected_trip_data.predicted_delay !== undefined && this.state.selected_trip_data.predicted_delay !== null ? this.state.selected_trip_data.predicted_delay + ' s' : "Chybí data"}</td>
    </tr>
    <tr>
      <td>Aktuální rychlost</td>
      <td>{this.state.selected_trip_data.speed !== undefined ? this.state.selected_trip_data.speed : "Chybí data"} km/h</td>
    </tr>
    <tr>
    
      <td>Čas záznamu</td>
      <td>{this.state.selected_trip_data.timestamp !== undefined ? new Date(this.state.selected_trip_data.timestamp).toLocaleString() : "Chybí data"}</td>
    </tr>
    <tr>
      <td>Provozovatel</td>
      <td>{this.state.selected_trip_data.agency !== undefined ? this.state.selected_trip_data.agency : "Chybí data"}</td>
    </tr>
    <tr>
      <td>Typ vozidla</td>
      <td>{this.state.selected_trip_data.vehicle_type !== undefined ? "Autobus" : "Chybí data"}</td>
    </tr>
    </tbody>
        </Table>      
      </Col>
      <Col md="auto">
      <BarChart width={400} height={250} data={this.state.selected_trip_stats}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="name">
         
         </XAxis>
       <YAxis/>
       <Tooltip_rechart formatter={(value) => this.minuteFormater(value)} />

       <Bar dataKey="delay" name='Zpoždění během týdne' label={{ position: 'top'}} formatter={(value) => this.minuteFormater(value)} >
       {
            this.state.selected_trip_stats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={this.getColorByValue(entry.delay)}/>
            ))
          }
       </Bar>
      </BarChart>
      </Col>
      </Row>
      </Container>
  )

  minuteFormater(value)
  {
    return value + " s";
  }

  getColorByValue(value)
  {
    if(value <= 60)
    {
      return "#1AAB00";
    }
    if(value <= 180)
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


  getNextStop()
  {
    var ret_str = '';
    for(var i = 0; i < this.state.stops.length; i++)
    {
      if(this.state.stops[i].key === this.state.selected_trip_data.next_stop_id)
      {
        ret_str += this.state.stops[i].content.name
      }
    }
    for(var i = 0; i < this.state.selected_trip_stop_delays.length; i++)
    {
      if(this.state.selected_trip_stop_delays[i].destination === this.state.selected_trip_data.next_stop_id)
      {
        ret_str += ' (+' + this.state.selected_trip_stop_delays[i].avg_delay + 'sekund)';
      }
    }
    return ret_str;
  }

  getNextNextStop()
  {
    var ret_str = '';
    for(var i = 0; i < this.state.stops.length; i++)
    {
      if(this.state.stops[i].key === this.state.selected_trip_data.next_stop_id)
      {
        if(i+1 < this.state.stops.length)
        {
          ret_str += this.state.stops[i+1].content.name;
        }
        
        
      }
    }
    for(var i = 0; i < this.state.selected_trip_stop_delays.length; i++)
    {
      if(this.state.selected_trip_stop_delays[i].destination === this.state.selected_trip_data.next_stop_id)
      {
        if(i+1 < this.state.selected_trip_stop_delays.length)
        {
          ret_str += ' (+' + this.state.selected_trip_stop_delays[i+1].avg_delay + 's)';
        }
        
      }
    }
    return ret_str;
  }

  getStops(stop_id) {
    console.log('loading stop')
    fetch('http://'+ host +':3000/getStopForTrip/' + stop_id
    ).then(response => response.json())
      .then(items => this.addStopsOnMap(items))
      .catch(err => console.log(err))
  }




  addStopsOnMap(stop_json) {
    var stops = [];
    stop_json.forEach(stop => {
      stops.push({ key: stop['stop_id'], position: [stop['latitude'], stop['longitude']], content: { name: stop['name'], zone_id: stop['zone_id'], wheelchair_acc: stop['wheelchair_acc'],
       arival_time : stop['arival_time'], departure_time : stop['departure_time'], avg_delay : stop["sum_delay"], sequence : stop['sequence'] } })
    });
    this.setState({ stops, selected_trip_stops:stop_json });
  }

  getRoute(trip_id) {
    console.log('loading route')
    fetch('http://'+ host +':3000/getRouteForTrip/' + trip_id)
      .then(response => response.json())
      .then(items => this.processRoute(items))
      .catch(err => console.log(err))
  }

  getItems() {
    console.log('loading items');
    fetch('http://'+ host +':3000/getLastVehiclePositions')
      .then(response => response.json())
      .then(items => this.itemsToMarkers(items))
      .catch(err => console.log(err))
  }

  getLastTripData(trip_id){
    console.log('loading trip data');
    fetch('http://'+ host +':3000/getLastTripData/' + trip_id)
      .then(response => response.json())
      .then(items => this.setState({ selected_trip_data : items[0]}))
      .catch(err => console.log(err))
  }

  getTripStats(trip_id){
    console.log('loading trip data');
    fetch('http://'+ host +':3000/getTripStats/' + trip_id)
      .then(response => response.json())
      .then(items => this.setState({ selected_trip_stats : items}))
      .catch(err => console.log(err))
  }

  getStops_delays(trip_id){
    console.log('loading trip data');
    fetch('http://'+ host +':3000/getStopDelays/' + trip_id)
      .then(response => response.json())
      .then(items => this.setState({ selected_trip_stop_delays : items}))
      .catch(err => console.log(err))
  }

getHistogramData()
{
  fetch('http://'+ host +':3000/getHistogramStats/'
  ).then(response => response.json())
    .then(items => {this.setState({dataByHour:items})})
    .catch(err => console.log(err))
}

getHistogramDataByDay()
{
  fetch('http://'+ host +':3000/getHistogramStatsbyDay/'
  ).then(response => response.json())
    .then(items => {this.setState({dataByDay:items, dataLoading:'none'})})
    .catch(err => console.log(err))
}

getBadSections()
{
  fetch('http://'+ host +':3000/getBadSections/'
  ).then(response => response.json())
    .then(items => {this.setState({badSections:items})})
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
    this.getLastTripData(selected_trip);
    this.getTripStats(selected_trip);
    this.getStops_delays(selected_trip);
    this.setState({ dockVisible, vehiclesHidden, selected_trip, mapCenter, zoomLevel:15 });

    console.log(`Clicked at`)
  }


  handlePopupClose = (e) => {
    var stops = []
    var route = []
    var dockVisible = false;
    var vehiclesHidden = false;
    var selected_trip = "";
    var selected_trip_data = {};
    var selected_trip_stops = {};
    var selected_trip_stop_delays = [];
    //var selected_trip_stats = {};
    this.setState({ stops, route, dockVisible, vehiclesHidden, selected_trip, selected_trip_data, selected_trip_stops })
  }

  render() {
    return (
      <div style={{ height: '100%'}}>
        <div>
      <Menu left >
      <a id="home" className="menu-item" onClick={() => {this.setState({modalShow:true, dataLoading:'initial'}); this.getHistogramData(); this.getHistogramDataByDay();}}> Histogramy zpoždění</a> 
      <a id="about" className="menu-item" onClick={() => {this.setState({modalShow_sections:true}); this.getBadSections();}}>Přehled úseků</a>
    </Menu>  
    <MydModalWithGrid show={this.state.modalShow} dataLoading={this.state.dataLoading} dataByHour={this.state.dataByHour} dataByDay = {this.state.dataByDay} onHide={() => this.setState({modalShow:false})} />
    <MydModalWithTable show={this.state.modalShow_sections} dataLoading={this.state.dataLoading} badSections={this.state.badSections} onHide={() => this.setState({modalShow_sections:false})} />
    <Dock position='bottom' isVisible={this.state.dockVisible} dimMode='none'>
    <Button variant="danger" style={{ float: 'right' }} onClick={this.handlePopupClose}>X</Button>
    {this.DockContent()}
  </Dock>
    </div>
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

      </Map>
      </div>
    )
  }
}