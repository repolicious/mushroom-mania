import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
} from 'reactstrap';
import './Modal.scss';

const ModalPoisonous = (props) => {
  const [open, setOpen] = useState(true);
  const [focusAfterClose] = useState(true);
  const { currentMushroom } = props;

  // Close only: a toggle reopened the modal on a double press during its fade-out,
  // which left reactstrap's body scroll lock on for the rest of the game.
  const close = () => setOpen(false);

  return (
        <div className="modal">
          <Modal returnFocusAfterClose={focusAfterClose} isOpen={open} size="lg" labelledBy="poison-title" centered>
            <ModalBody>
              <div>
                <h2 id="poison-title" className="m-1 modal-h2">{currentMushroom.name}</h2>
                <p className="modal-p m-1">Oh, NO! Poisonous Mushrooms cause 2 mushrooms in the basket to die!</p>
                <p className="modal-p m-1">IF you have two or less mushrooms in the basket they will die and the basket will be empty.</p>
                <div><Button className="btn btn-danger btn-game m-1" onClick={close}>Keep Trying</Button></div>
                <div>
                <img className="img-fluid" src={currentMushroom.imgUrl} alt={currentMushroom.name}/>
                </div>
              </div>
            </ModalBody>
          </Modal>
        </div>
  );
};

export default ModalPoisonous;
