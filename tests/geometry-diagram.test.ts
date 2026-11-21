import {describe, expect, it} from 'vitest';
import {geometryDiagramFromStatement} from '../src/geometry-diagram';
import {emptyNotebook, newExercise, putExercise} from '../src/notebook';

describe('geometry diagrams generated from imported problem text', () => {
  it('creates a labeled 2D schematic and extracts given side lengths and angles', () => {
    const diagram = geometryDiagramFromStatement('In triangle ABC, AB = 5 cm and angle ACB = 90 degrees. Find BC.');
    expect(diagram).toMatchObject({
      figure: 'triangle',
      vertices: ['A', 'B', 'C'],
      givens: ['AB = 5 cm', '∠ACB = 90°'],
      strokes: [],
    });
  });

  it('recognizes 3D solids before matching related plane shapes', () => {
    expect(geometryDiagramFromStatement('Rectangular prism ABCD-EFGH has AB = 6 cm and AE = 10 cm.'))
      .toMatchObject({figure: 'prism', vertices: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], givens: ['AB = 6 cm', 'AE = 10 cm']});
    expect(geometryDiagramFromStatement('A cone has radius 3 cm and height 4 cm.'))
      .toMatchObject({figure: 'cone', givens: ['radius = 3 cm', 'height = 4 cm']});
    expect(geometryDiagramFromStatement('ABCD is a cyclic quadrilateral.'))
      .toMatchObject({figure: 'quadrilateral', vertices: ['A', 'B', 'C', 'D']});
  });

  it('recognizes Vietnamese geometry terms and dimensions from imported text', () => {
    expect(geometryDiagramFromStatement('Tam giác ABC có AB = 5 cm và góc ACB = 90 độ. Tìm BC.'))
      .toMatchObject({figure: 'triangle', vertices: ['A', 'B', 'C'], givens: ['AB = 5 cm', '∠ACB = 90°']});
    expect(geometryDiagramFromStatement('Hình nón có bán kính 3 cm và chiều cao 4 cm.'))
      .toMatchObject({figure: 'cone', givens: ['bán kính = 3 cm', 'chiều cao = 4 cm']});
  });

  it('does not invent a figure for a non-geometry question and persists additions with the exercise', () => {
    expect(geometryDiagramFromStatement('Solve 2x + 4 = 10.')).toBeUndefined();
    const diagram = geometryDiagramFromStatement('Triangle ABC has AB = 5 cm.')!;
    const exercise = {...newExercise(), title: 'Geometry', statement: 'Triangle ABC has AB = 5 cm.', geometryDiagram: {
      ...diagram,
      strokes: [{id: 'construction', tool: 'line' as const, color: '#2469c6', points: [{x: 40, y: 40}, {x: 180, y: 180}]}],
    }};
    const saved = putExercise(emptyNotebook(), exercise).exercises[0];
    expect(saved.geometryDiagram?.strokes[0]).toMatchObject({tool: 'line', color: '#2469c6'});
  });
});
