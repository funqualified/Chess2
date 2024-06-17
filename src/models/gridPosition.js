class GridPosition {
  row;
  col;

  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  equals(other) {
    return this.row === other.row && this.col === other.col;
  }

  distance(other) {
    return Math.sqrt(Math.pow(this.row - other.row, 2) + Math.pow(this.col - other.col, 2));
  }

  isIn(array) {
    return array.some((element) => {
      return this.equals(element);
    });
  }

  getRow() {
    return this.row;
  }

  getCol() {
    return this.col;
  }
}

export default GridPosition;
