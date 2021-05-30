import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button className={"square" + (props.isSol ? " solution" : "")} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, solution) {
    // by taking a parameter here, we can implicitly call Game::handleClick() with an argument without the Square object passing anything
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
        isSol={solution}
      />
    );
  }

  render() {
    const display = Array(3).fill(null);

    // we don't need keys because this list won't change
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
            <div className="board-row">
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
          squares: Array(9).fill(null),
          location: null,
          p1: Array(numPieces).fill(false),
          p2: Array(numPieces).fill(false),
          piece: null /* may not be needed */
        }
      ],
      stepNumber: 0,
      xIsNext: true,
      ascendingHistory: true,
      p1Piece: null,
      p2Piece: null
    };
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  handleClick(i) {
    // grab the history up until this point (in the case we went back)
    const history = this.state.history.slice(0, this.state.stepNumber + 1);

    // state of the board at this point in the history 
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    // if made a winning move, or we click on an X or O, then we are done
    if (calculateWinner(squares) || squares[i]) {
      return;
    }

    // otherwise, a valid move was made, so we will switch turns
    squares[i] = this.state.xIsNext ? "X" : "O";

    // add this move to the history, update other properties as needed
    this.setState({
      history: history.concat([
        {
          squares: squares,
          location: i,
          p1: current.p1,
          p2: current.p2
        }
      ]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
  }

  jumpTo(step) {
    // because we change the state, we have to rerender the board 

    // when we rerender, the stepNumber will have changed, pointing to a different part in the board history

    // we can still jump forward in time, unless we make a move, upon which the history will be rewritten
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
  }

  handleCheckboxChange(event) {
    this.setState({
        ascendingHistory: !this.state.ascendingHistory
    });
  }

  handleRadioChange(piece) {
    return (event) => {
      alert(`${event.target.name} is piece #${piece}`);
      this.setState({
        [event.target.name]: piece
      });
    }
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

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
      status = "Winner: " + current.squares[winner[0]];
    } else if (current.squares.includes(null)) {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    } else {
      // if there are no free squares, and a winner has not been decided, then there is a draw
      status = "Draw!";
    }

    // because "moves" is just a copy of the history, it is ok to reverse it without messing anything up
    // because the jumpTo() call is bound _before_ the reversal is made, the reverse() operation will not affect the index passed into jumpTo()
    // pass the solution squares into Board for rendering

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
          />
          <PieceSelector
            pNum={2}
            numPieces={numPieces}
            disabled={current.p2}
            onClick={this.handleRadioChange}
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
        <div>
          <label htmlFor={`p${pNum}-${i+1}`} className={`p${pNum}`}>{i+1}</label>
          <input 
            id={`p${pNum}-${i+1}`} 
            type="radio" name={`p${pNum}Piece`} 
            disabled={this.props.disabled[i]} 
            onClick={this.props.onClick(i+1)}
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
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
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