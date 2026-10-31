import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
} from 'reactstrap';
import { mediaUrl } from '../helpers/media';
import './Modal.scss';


const ModalDeadly = (props) => {
  const [focusAfterClose] = useState(true);
  const { currentMushroom, onPlayAgain } = props;

  return (
        <div className="modal">
          <Modal returnFocusAfterClose={focusAfterClose} isOpen size="lg" labelledBy="deadly-title" centered>
            <ModalBody>
              <div>
                <h2 id="deadly-title" className="m-1 modal-h2">{currentMushroom.name}</h2>
                <img className="deadly" src={currentMushroom.imgUrl} alt={currentMushroom.name}/>
                <h3 className="modal-p m-1">DEADLY MUSHROOM</h3>
                <h2 className="modal-p m-0">GAME OVER</h2>
                <div><Button className="btn btn-danger btn-game m-1" onClick={onPlayAgain}>Play Again</Button></div>
                <img className="img-fluid bowser" src={mediaUrl('images/Death.webp')} alt="Bowser"/>
                  <div className="m-4">
                  </div>
              </div>
            </ModalBody>
          </Modal>
        </div>
  );
};

export default ModalDeadly;
