import {describe, expect, it} from 'vitest';
import {calculateGeometry, geometryHelp, geometryPromptContext, geometryShapes} from '../src/geometry';

describe('geometry calculations and tutoring', () => {
  it('calculates representative 2D and 3D measurements with units and formulas', () => {
    const circle = calculateGeometry('circle', {r: 5}, 'cm');
    expect(circle.measurements.map(({label, unit}) => [label, unit])).toEqual([['Area', 'cm²'], ['Circumference', 'cm']]);
    expect(circle.measurements[0].value).toBeCloseTo(25 * Math.PI);
    expect(circle.markdown).toContain(String.raw`A=\pi r^2`);

    const cone = calculateGeometry('cone', {r: 3, h: 4}, 'm');
    expect(cone.measurements.map(({label, value, unit}) => [label, value, unit])).toEqual([
      ['Slant height', 5, 'm'], ['Volume', 12 * Math.PI, 'm³'], ['Total surface area', 24 * Math.PI, 'm²'],
    ]);

    const box = calculateGeometry('box', {l: 2, w: 3, h: 6}, 'mm');
    expect(box.measurements.map(({label, value}) => [label, value])).toEqual([
      ['Volume', 36], ['Total surface area', 72], ['Space diagonal', 7],
    ]);
  });

  it('rejects invalid dimensions, units and results outside numeric range', () => {
    expect(() => calculateGeometry('circle', {r: 0})).toThrow('greater than zero');
    expect(() => calculateGeometry('rectangle', {l: 2, w: NaN})).toThrow('greater than zero');
    expect(() => calculateGeometry('circle', {r: 1}, 'inches')).toThrow('Use mm, cm, m or units');
    expect(() => calculateGeometry('rectangle', {l: 1e-200, w: 1e-200})).toThrow('supported number range');
    expect(geometryShapes.some(shape => shape.dimension === '2D')).toBe(true);
    expect(geometryShapes.some(shape => shape.dimension === '3D')).toBe(true);
  });

  it('provides exact local geometry help only for a complete problem request', () => {
    const statement = 'A right circular cone has radius 3 cm and perpendicular height 4 cm. Find its slant height, volume and total surface area, including the base.';
    expect(geometryHelp(statement, 'hint1')).toContain('V=\\frac{\\pi r^2h}{3}');
    expect(geometryHelp(statement, 'hint2')).toContain(String.raw`\pi\cdot 3^2\cdot 4`);
    expect(geometryHelp(statement, 'hint3')).toContain('Slant height');
    expect(geometryHelp(statement, 'chat', 'How does the formula work?')).toBeUndefined();
    expect(geometryHelp(statement.replace('perpendicular ', ''), 'hint3')).toBeUndefined();
  });

  it('adds cautious 2D and 3D theorem guidance only when relevant', () => {
    expect(geometryPromptContext('Prove opposite angles in a cyclic quadrilateral are supplementary.', true)).toContain('concyclic vertices');
    expect(geometryPromptContext('Find the angle between a line and a plane in 3D.')).toContain('orthogonal projection');
    expect(geometryPromptContext('Solve 2x+3=7')).toBe('');
  });
});
