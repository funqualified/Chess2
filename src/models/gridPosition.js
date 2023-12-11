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

  isIn(array) {
    return array.some((element) => {
      return this.equals(element);
    });
  }
}

export default GridPosition;
