
// @flow

import React, { Component, Fragment } from 'react'
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'



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


type Position = [number, number]

type Props = {|
  content: string,
  position: Position,
|}

type MarkerData = {| ...Props, key: string |}

const MyPopupMarker = ({ content, position }: Props) => (
  <Marker position={position} icon={pointerIcon}>
    <Popup>{content}</Popup>
  </Marker>
)

const MyMarkersList = ({ markers }: { markers: Array<MarkerData> }) => {
  const items = markers.map(({ key, ...props }) => (
    <MyPopupMarker key={key} {...props} />
  ))
  return <Fragment>{items}</Fragment>
}

type State = {
  markers: Array<MarkerData>,
}

export default class CustomComponent extends Component<{}, State> {
  state = {
    zoomLevel : 11,
    markers: [
/*      { key: 'marker1', position: [50.0753564, 14.4408661], content: 'Autobus 311' },
      { key: 'marker2', position: [50.2434047, 14.3082469], content: 'Autobus 375' },
      { key: 'marker3', position: [50.0793283, 14.7380869], content: 'Autobus 357' },
      { key: 'marker4', position: [49.9602083, 14.3089336], content: 'Autobus 328' }, //
      { key: 'marker5', position: [50.1304150, 14.1510050], content: 'Autobus 385' },*/
    ],
    items : []
  }


  itemsToMarkers(items){
     var markers = [];
    items.forEach(item => {
      markers.push({key : item['vehicle_id'], position : [item['latitude'], item['longitude']], content : item['vehicle_id'] + item['timestamp']});
    });
    console.log(markers);
    this.setState({markers});
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

  render() {
    return (
      <Map center={[50.0753564, 14.4408661]} zoomControl={false} zoom={this.state.zoomLevel} >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MyMarkersList markers={this.state.markers} />
      </Map>
    )
  }
}