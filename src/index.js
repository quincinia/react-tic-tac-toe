import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    // by taking a parameter here, we can implicitly call Game::handleClick() with an argument without the Square object passing anything
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
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
            rowItems[j] = this.renderSquare(3*i+j);
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

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
          location: null
        }
      ],
      stepNumber: 0,
      xIsNext: true
    };
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
          location: i
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

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((item, index) => {
      const desc = index ?
        `Go to move #${index} ${locationFromID(item.location)}` :
        `Go to game start ${locationFromID(item.location)}`;
      return (
        <li key={index}>
          <button onClick={() => this.jumpTo(index)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={i => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
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
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
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