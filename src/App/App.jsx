import React from 'react';
import './App.scss';
import PropTypes from 'prop-types';
import mushroomData from '../helpers/data/mushroomData';
import { mediaUrl, playSound } from '../helpers/media';
import Forest from '../components/Forest';
import Basket from '../components/Basket';
import ModalPoisonous from '../components/ModalPoisonous';
import ModalDeadly from '../components/ModalDeadly';
import ModalFullBasket from '../components/ModalFullBasket';
import mushroomShape from '../helpers/propz/mushroomShape';

class App extends React.Component {
  state = {
    mushrooms: [],
    basket: [],
    currentMushroom: {},
    // Keys the poison/deadly modals, so every pick mounts a fresh (open) modal.
    pickCount: 0,
  }

  static propTypes = {
    mushrooms: PropTypes.arrayOf(mushroomShape.mushroomShape),
  }

  componentDidMount() {
    const mushrooms = mushroomData.getMushrooms();
    this.setState({ mushrooms });

    const basket = mushroomData.getBasket();
    this.setState({ basket });

    const totalNormalMushrooms = mushroomData.getNormalMushrooms();
    this.setState({ totalNormalMushrooms });
  }

  restart = (e) => {
    if (e) {
      e.preventDefault();
    }
    mushroomData.emptyBasket();
    this.setState({
      mushrooms: mushroomData.getMushrooms(),
      basket: mushroomData.getBasket(),
      currentMushroom: {},
    });
    playSound(mediaUrl('sounds/sm64_here_we_go.wav'));
  }


  pickAMushroomEvent = (e) => {
    e.preventDefault();
    const currentMushroom = mushroomData.pickAMushroom();
    const basket = mushroomData.getBasket();
    this.setState(({ pickCount }) => ({ basket, currentMushroom, pickCount: pickCount + 1 }));
  }

  render() {
    const { mushrooms } = this.state;
    const { currentMushroom } = this.state;
    const { basket } = this.state;
    const { totalNormalMushrooms } = this.state;
    const { pickCount } = this.state;

    let modal = '';
    if (currentMushroom.isPoisonous) {
      modal = <div className="d-flex flex-wrap justify-content-center align-items-center"><ModalPoisonous key={pickCount} currentMushroom={currentMushroom}/></div>;
    } else if (currentMushroom.isDeadly) {
      modal = <div className="d-flex flex-wrap justify-content-center align-items-center"><ModalDeadly key={pickCount} currentMushroom={currentMushroom} onPlayAgain={this.restart}/></div>;
    }

    return (
      <div className="App container-fluid">
          {modal}
      {
        // eslint-disable-next-line max-len
        basket.length >= totalNormalMushrooms ? (<div className="d-flex flex-wrap justify-content-center align-items-center"><ModalFullBasket totalNormalMushrooms={totalNormalMushrooms} currentMushroom={currentMushroom} onPlayAgain={this.restart}/></div>) : (<div></div>)
      }
      <h1>MUSHROOM MANIA</h1>
        <div className="row">
          <div className="col-12 col-lg-3 d-flex flex-lg-column justify-content-center justify-content-lg-start align-items-center">
            <div>
              {
              // eslint-disable-next-line max-len
              basket.length !== totalNormalMushrooms || basket.length === 0 ? (<button className="btn btn-danger btn-game m-2" onClick={this.pickAMushroomEvent}>PICK MUSHROOM</button>) : (<button className="btn btn-danger btn-game ml-4 mr-4 mt-2 mb-2 " onClick={this.restart}>RESTART</button>)
              }
            </div>
            <div>
              <img className="mario" src={mediaUrl('images/Mario_Party_4.webp')} alt='mario'></img>
            </div>
          </div>
          <div className="col-12 col-lg-9">
            <Basket className="m-0 p-0 basket" basket={basket} totalNormalMushrooms={totalNormalMushrooms}/>
          </div>
        </div>
        <Forest className="m-0 p-0 forest" mushrooms={mushrooms}/>
      </div>
    );
  }
}

export default App;
