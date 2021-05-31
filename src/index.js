import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button 
      className={"square " + props.player + (props.isSol ? " solution" : "")} 
      onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, solution) {
    // by taking a parameter here, we can implicitly call Game::handleClick() with an argument without the Square object passing anything
    return (
      <Square
        value={this.props.squares[i]?.piece}
        onClick={() => this.props.onClick(i)}
        isSol={solution}
        player={this.props.squares[i]?.player}
        key={i}
      />
    );
  }

  render() {
    const display = Array(3).fill(null);

    // adding keys to satisfy warnings, but they aren't used here
    for (let i = 0; i < 3; i++) {

        // generate row items
        let rowItems = Array(3).fill(null);
        for (let j = 0; j < 3; j++) {
            // if this square is part of the solution, then mark it
            let solution = this.props.solutions?.includes(3*i+j);
            rowItems[j] = this.renderSquare(3*i+j, solution);
        }

        // add rows to display
        display[i] = (
            <div className="board-row" key={i}>
                {rowItems}
            </div>
        );
    }

    return (
      <div>
        {display}
      </div>
    );
  }
}

const numPieces = 6;
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null), // board state
          location: null, // index of placed item
          p1: Array(numPieces).fill(true), // bit vectors representing 
          p2: Array(numPieces).fill(true), // the available pieces left
        }
      ],
      stepNumber: 0, // index into the history
      xIsNext: false, // false = P1, true = P2
      ascendingHistory: true,
      p1Piece: null, // currently selected 
      p2Piece: null  // pieces
    };
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  handleClick(i) {
    // grab the history up until this point (in the case we went back)
    const history = this.state.history.slice(0, this.state.stepNumber + 1);

    // state of the board at this point in the history 
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    // get the piece that the current player has selected
    const selectedPiece = this.state.xIsNext ? this.state.p2Piece : this.state.p1Piece;

    // if a winner has been decided, or we make an invalid move, then we are done 
    if (calculateWinner(squares) || squares[i]?.piece > selectedPiece) {
      return;
    }

    if (selectedPiece === null) {
      alert((this.state.xIsNext ? "P2" : "P1") + " Please select a piece!"); // TODO: remove this later
      return;
    }

    // (add a check for draws here too? don't think its needed)

    // otherwise, a valid move was made, so we will save it into this spot
    // use assignment instead of changing properties because we don't know if the square is null or not
    squares[i] = {
      piece: selectedPiece,
      player: this.state.xIsNext ? "P2" : "P1"
    };

    // update bit vector of the player 
    const bitVector = (this.state.xIsNext ? current.p2 : current.p1).slice();
    bitVector[selectedPiece-1] = false;

    // add this move to the history, update other properties as needed
    this.setState({
      history: history.concat([
        {
          squares: squares,
          location: i,
          p1: this.state.xIsNext ? current.p1 : bitVector,
          p2: this.state.xIsNext ? bitVector : current.p2
        }
      ]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
      [this.state.xIsNext ? "p2Piece" : "p1Piece"]: null // will not clear the piece of the other player for convenience's sake
    });
  }

  jumpTo(step) {
    // because we change the state, we have to rerender the board 

    // when we rerender, the stepNumber will have changed, pointing to a different part in the board history

    // we can still jump forward in time, unless we make a move, upon which the history will be rewritten
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 1
    });
  }

  handleCheckboxChange(event) {
    this.setState({
        ascendingHistory: !this.state.ascendingHistory
    });
  }

  handleRadioChange(piece) {
    return (event) => {
      alert(`${event.target.name} is piece #${piece}`); // TODO: also remove this later
      this.setState({
        [event.target.name]: piece
      });
    }
  }

  determineDraw(current) {
    const p1 = current.p1.slice();
    const p2 = current.p2.slice();
    function moveExists(item, index) {
      return item && current.squares.some(square => {
        return square === null || square.piece < index+1;
      });
    }
    // p1 and p1 must have no moves to be a draw
    // true when draw exists
    return !p1.some(moveExists) && // idk about putting AND here 
           !p2.some(moveExists);
  }

  render() {
    // grab board state and winner (if there is one)
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    // generate previous moves list
    const moves = history.map((item, index) => {
      let desc = index ?
        `Go to move #${index} ${locationFromID(item.location)}` :
        `Go to game start ${locationFromID(item.location)}`;
      if (index === this.state.stepNumber)
        desc = <b>{desc}</b>;
      return (
        <li key={index}>
          <button onClick={() => this.jumpTo(index)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      // because calculateWinner() now returns an array, we need to dereference it
      status = "Winner: " + current.squares[winner[0]].player;
    } else if (this.determineDraw(current) === true) {
      status = "Draw!";
    } else {
      status = "Next player: " + (this.state.xIsNext ? "P2" : "P1");
    }

    // because "moves" is just a copy of the history, it is ok to reverse it without messing anything up
    // because the jumpTo() call is bound _before_ the reversal is made, the reverse() operation will not affect the index passed into jumpTo()
    // pass the solution squares into Board for rendering

    // moved above the Game declaration
    // const numPieces = 6;
    // const disableList = Array(numPieces).fill(false);
    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={i => this.handleClick(i)}
            solutions={winner}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{this.state.ascendingHistory ? moves : moves.reverse()}</ol>
        </div>
        <div className="game-mods">
          <label>
            Reverse history: 
            <input name="toggle" type="checkbox" onChange={(e) => this.handleCheckboxChange(e)} />
          </label>
          <PieceSelector
            pNum={1}
            numPieces={numPieces}
            disabled={current.p1}
            onClick={this.handleRadioChange}
            checked={this.state.p1Piece}
          />
          <PieceSelector
            pNum={2}
            numPieces={numPieces}
            disabled={current.p2}
            onClick={this.handleRadioChange}
            checked={this.state.p2Piece}
          />
        </div>
      </div>
    );
  }
}


class PieceSelector extends React.Component {
  render() {
    let pieces = Array(this.props.numPieces);
    const pNum = this.props.pNum;
    for (let i = 0; i < pieces.length; i++) {
      pieces[i] = (
        <div key={i}>
          <label htmlFor={`p${pNum}-${i+1}`} className={`P${pNum}`}>{i+1}</label>
          <input 
            id={`p${pNum}-${i+1}`} 
            type="radio" name={`p${pNum}Piece`} 
            disabled={!this.props.disabled[i]} 
            onClick={this.props.onClick(i+1)}
            onChange={e => {}} /* getting rid of warnings */
            checked={this.props.checked !== null && this.props.checked === i+1}
          />
        </div>
      );
    }

    // displaying the pieces in descending order
    return (
      <div className={`radioGroup`}>
        Player {this.props.pNum}:
        {pieces.reverse()}
      </div>
    );
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  // multiple solutions could be returned using concat or something, but that isn't really a priority
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // to determine a winner, we need to check who placed the piece
    if (squares[a] && 
        squares[a].player === squares[b]?.player && 
        squares[a].player === squares[c]?.player) {
      return lines[i];
    }
  }
  return null;
}

function locationFromID(id) {
    if (id === null) 
        return '';
    else
        return `(${Math.trunc(id/3)}, ${id%3})`;
}