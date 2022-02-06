import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import { MapUtils } from '../utils/MapUtils';
import { CovidDataService } from '../service/CovidDataService';
import CaseCard from './CaseCard'

class CovidMap extends Component {
  static defaultProps = {
    center: {
      lat: 40,
      lng: -95
    },
    zoom: 6
  };

  state = {
    zoomLevel: 6,
    boundary: {},
    points: {}
  }

  render() {
    return (
      // Important! Always set the container height explicitly
      <div style={{ height: '100vh', width: '100%' }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: "AIzaSyDzt6zlUyk1nOEziTAvI5gqymDhup5S9qg" }}
          defaultCenter={this.props.center}
          defaultZoom={this.props.zoom}
          onGoogleApiLoaded={
              () => {
                  CovidDataService.getAllCountyCases()
                    .then(response => {
                        this.setState({
                            points: MapUtils.convertCovidPoints(response.data)
                        });
                    }).catch(error => {
                        console.error(error);
                  })
              }
          }
          onChange={(changeEventObject) => {
            this.setState({
                zoomLevel: changeEventObject.zoom,
                boundary: changeEventObject.bounds
            });
          }}
        >
          {this.renderCovidPoints()}
        </GoogleMapReact>
      </div>
    );
  }
  renderCovidPoints() {
    const result = [];
    const zoomLevel = this.state.zoomLevel;
    // 1-4 nation level
    // 5-9 state level
    // 10-20 county level
    if (zoomLevel < 1 || zoomLevel > 20) {
        return result;
    }
    let pointsLevel = 'county';
    if (zoomLevel >= 1 && zoomLevel <= 4) {
        pointsLevel = 'nation';
    } else if (zoomLevel > 4 && zoomLevel <= 9) {
        pointsLevel = 'state';
    }
    const pointsToRender = this.state.points[pointsLevel];
    // Sanity Check -> first time render this component but data not available
    if (!pointsToRender) {
        return result;
    }
    if (pointsLevel === 'county') {
        for (const point of pointsToRender) {
            if (MapUtils.isInBoundary(this.state.boundary, point.coordinates)) {
                result.push(
                    <CaseCard
                        lat={point.coordinates.latitude}
                        lng={point.coordinates.longitude}
                        subTitle={point.province}
                        title={point.county}
                        confirmed={point.stats.confirmed}
                        deaths={point.stats.deaths}
                    />
                )
            }
        }
    } else if (pointsLevel === 'state') {
        for (const state in pointsToRender) {
            const point = pointsToRender[state];
            if (MapUtils.isInBoundary(this.state.boundary, point.coordinates)) {
                result.push(
                    <CaseCard
                        lat={point.coordinates.latitude}
                        lng={point.coordinates.longitude}
                        subTitle={point.country}
                        title={state}
                        confirmed={point.confirmed}
                        deaths={point.deaths}
                    />
                )
            }
        }
    }
    return result;
  }
}

export default CovidMap;