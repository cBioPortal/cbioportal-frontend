export default () => {

    const notes = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "E"];

    let index =  Math.floor(Math.random() * ((12-1) - 0 + 1)) + 0;

    return notes[index];


};