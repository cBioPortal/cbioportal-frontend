import { default as Immutable } from 'immutable'

export default () => {

    const strings = [

        {rootNote: 'E', notes: ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']},
        {rootNote: 'A', notes: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A']},
        {rootNote: 'D', notes: ['D','D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D']},
        {rootNote: 'G', notes: ['G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D','D#', 'E', 'F', 'F#', 'G']},
        {rootNote: 'B', notes: ['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']},
        {rootNote: 'E', notes: ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']}

    ];

    let noteId = 0;
    strings.forEach((str, i) => {
        str.notes.forEach((note, i) => {
            str.notes[i] = {note: note, id: noteId};
            noteId++;
        });
    });

    return Immutable.fromJS(strings);

};