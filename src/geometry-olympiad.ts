import {parseProofScene,type ProofScene} from './geometry-proof';
import {stripProblemLayout} from './problem-text';

export const imo1970Problem=String.raw`In the tetrahedron ABCD, angle BDC is a right angle. Suppose that the foot H of the perpendicular from D to the plane ABC is the intersection of the altitudes of triangle ABC. Prove that $(AB + BC + CA)^2 \leq 6(AD^2 + BD^2 + CD^2)$. For what tetrahedra does equality hold?`;
export const imo2019Problem='In triangle ABC, point A1 lies on side BC and point B1 lies on side AC. Let P and Q be points on segments AA1 and BB1, respectively, such that PQ is parallel to AB. Let P1 be a point on line PB1, such that B1 lies strictly between P and P1, and ∠PP1C = ∠BAC. Similarly, let Q1 be a point on line QA1, such that A1 lies strictly between Q and Q1, and ∠CQ1Q = ∠CBA. Prove that points P, Q, P1, and Q1 are concyclic.';
export const isoscelesIncenterProblem='Let ABC be a triangle with AB = AC. The angle bisectors of ∠CAB and ∠ABC meet the sides BC and CA at D and E, respectively. Let K be the incentre of triangle ADC. Suppose that ∠BEK = 45°. Find all possible values of ∠CAB.';

// Full-statement matching only: changed hypotheses, extra conditions and different
// conclusions must still go through AI. Accept equivalent editor/PDF formatting.
function normalized(statement:string):string {
  return stripProblemLayout(statement)
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1')
    .replace(/^\s*Problem\s+\d+\.\s*/,'').replace(/\\angle\b|̸/g,'∠').replace(/([A-Z])_\{?1\}?/g,(_,point:string)=>point+'1')
    .replace(/\\circ\b|[◦º]/g,'°').replace(/\^\{?°\}?/g,'°').replace(/\bincenter\b/g,'incentre')
    .replace(/\\(?:left|right)\b/g,'')
    .replace(/\\(?:leq|le)\b|<=/g,'≤').replace(/\\perp\b/g,'⊥')
    .replace(/\\triangle\b|[∆Δ△]/g,'triangle ')
    .replace(/\\\^/g,'^').replace(/\^\{2\}|²/g,'^2')
    .replace(/([A-Z]{2}|\))2\b/g,'$1^2')
    .replace(/\\[,;! ]/g,'').replace(/[\s${}]/g,'');
}
const acceptedStatements=[
  imo1970Problem,
  String.raw`Let ABCD be a nondegenerate tetrahedron with $DB \perp DC$.
Let H be the perpendicular projection of D onto the plane ABC.
Suppose that H is also the orthocenter of triangle ABC.
Prove that $(AB + BC + CA)^2 \leq 6(AD^2 + BD^2 + CD^2)$.
Determine all cases of equality.`,
  'In tetrahedron ABCD, DB is perpendicular to DC. The perpendicular projection H of D onto plane ABC is also the orthocenter of triangle ABC. Prove (AB+BC+CA)^2 <= 6(AD^2+BD^2+CD^2), and characterize equality.'
].map(normalized);

export function olympiadProofScene(statement:string):ProofScene|undefined {
  if(normalized(statement)===normalized(isoscelesIncenterProblem))return isoscelesIncenterConstruction();
  if(normalized(statement)===normalized(imo2019Problem))return imo2019Construction();
  if(!acceptedStatements.includes(normalized(statement)))return;
  // The hypotheses imply DA, DB, DC are pairwise perpendicular. Unequal axes
  // illustrate a general configuration instead of silently assuming equality.
  // H is computed by projection; it is never a guessed free point.
  return parseProofScene(JSON.stringify({
    dimension:'3D',
    givens:['ABCD is a nondegenerate tetrahedron.','DB is perpendicular to DC.','H is the perpendicular projection of D onto plane ABC.','H is the orthocenter of triangle ABC.'],
    goal:'Prove (AB + BC + CA)^2 ≤ 6(AD^2 + BD^2 + CD^2), and determine when equality holds.',
    points:[{id:'D',kind:'free',xyz:[0,0,0]},{id:'A',kind:'free',xyz:[2,0,0]},{id:'B',kind:'free',xyz:[0,3,0]},{id:'C',kind:'free',xyz:[0,0,4]},{id:'H',kind:'planeFoot',refs:['D','A','B','C']}],
    circles:[],
    faces:[['A','B','C'],['D','A','B'],['D','B','C'],['D','C','A']],
    edges:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'A',hidden:true},{a:'D',b:'A'},{a:'D',b:'B'},{a:'D',b:'C'},{a:'D',b:'H'},{a:'A',b:'H',auxiliary:true},{a:'B',b:'H',auxiliary:true},{a:'C',b:'H',auxiliary:true}],
    relations:[
      {kind:'perpendicular',refs:['B','D','C','D'],source:'angle BDC is a right angle'},
      {kind:'perpendicular',refs:['D','H','A','B'],source:'DH is perpendicular to plane ABC'},
      {kind:'perpendicular',refs:['D','H','A','C'],source:'DH is perpendicular to plane ABC'},
      {kind:'perpendicular',refs:['A','H','B','C'],source:'H is the orthocenter of ABC'},
      {kind:'perpendicular',refs:['B','H','A','C'],source:'H is the orthocenter of ABC'},
      {kind:'perpendicular',refs:['C','H','A','B'],source:'H is the orthocenter of ABC'}
    ],
    constructions:['Join AH, BH and CH to expose the altitude directions. Combine these with DH perpendicular to plane ABC to establish the edge perpendicularities before using Pythagoras.'],
    unresolved:[]
  }));
}

/** One admissible configuration; finding ALL apex angles remains the exercise.
 * Both h=1 and h=sqrt(3) satisfy the fixed angle. Other h must pass the same
 * checks rather than hiding the 45-degree constraint in descriptive text. */
export function isoscelesIncenterConstruction(height=1):ProofScene {
  return parseProofScene(JSON.stringify({
    dimension:'2D',
    givens:['ABC is a nondegenerate triangle with AB = AC.','AD bisects angle CAB and D lies on BC.','BE bisects angle ABC and E lies on CA.','K is the incenter of triangle ADC.','Angle BEK is 45°.'],
    goal:'Find all possible values of angle CAB.',
    points:[
      {id:'A',kind:'free',xyz:[0,height,0]},{id:'B',kind:'free',xyz:[-1,0,0]},{id:'C',kind:'free',xyz:[1,0,0]},
      {id:'D',kind:'angleBisector',refs:['A','B','C']},{id:'E',kind:'angleBisector',refs:['B','C','A']},
      {id:'K',kind:'incenter',refs:['A','D','C']}
    ],circles:[],
    edges:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'A'},{a:'A',b:'D'},{a:'B',b:'E'},{a:'E',b:'K'},
      {a:'A',b:'K',auxiliary:true},{a:'D',b:'K',auxiliary:true},{a:'C',b:'K',auxiliary:true}],
    relations:[
      {kind:'equalLength',refs:['A','B','A','C'],source:'AB = AC'},
      {kind:'between',refs:['B','D','C'],source:'D lies on BC'},
      {kind:'between',refs:['C','E','A'],source:'E lies on CA'},
      {kind:'equalAngle',refs:['C','A','D','D','A','B'],source:'AD bisects angle CAB'},
      {kind:'equalAngle',refs:['A','B','E','E','B','C'],source:'BE bisects angle ABC'},
      {kind:'equalAngle',refs:['A','D','K','K','D','C'],source:'K is the incenter of ADC'},
      {kind:'equalAngle',refs:['D','A','K','K','A','C'],source:'K is the incenter of ADC'},
      {kind:'equalAngle',refs:['D','C','K','K','C','A'],source:'K is the incenter of ADC'},
      {kind:'angle',refs:['B','E','K'],degrees:45,source:'angle BEK = 45 degrees'}
    ],
    constructions:['Join KA, KD and KC to expose the internal angle bisectors of triangle ADC. Use the symmetry of ABC, then consider every possible position of EK relative to the other lines. This is one admissible configuration, not an enumeration of all answers.'],
    unresolved:[]
  }));
}

/** All incidences and angles are constructed from the givens; no target circle. */
export function imo2019Construction():ProofScene {
  return parseProofScene(JSON.stringify({
    dimension:'2D',givens:['A1 lies on BC and B1 lies on AC.','P lies on AA1 and Q lies on BB1, with PQ parallel to AB.','B1 is strictly between P and P1, and angle PP1C equals angle BAC.','A1 is strictly between Q and Q1, and angle CQ1Q equals angle CBA.'],
    goal:'Prove P, Q, P1 and Q1 are concyclic.',
    points:[
      {id:'A',kind:'free',xyz:[0,4,0]},{id:'B',kind:'free',xyz:[-3,0,0]},{id:'C',kind:'free',xyz:[5,0,0]},
      {id:'A1',kind:'onLine',refs:['B','C'],t:.55},{id:'B1',kind:'onLine',refs:['A','C'],t:.6},
      {id:'P',kind:'onLine',refs:['A','A1'],t:.4},{id:'Q',kind:'parallelIntersection',refs:['P','A','B','B','B1']},
      {id:'P1',kind:'angleOnRay',refs:['P','B1','C','B','A','C']},
      {id:'Q1',kind:'angleOnRay',refs:['Q','A1','C','C','B','A']}
    ],circles:[],
    edges:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'A'},{a:'A',b:'A1'},{a:'B',b:'B1'},{a:'P',b:'Q'},{a:'P',b:'P1'},{a:'Q',b:'Q1'},{a:'P1',b:'C'},{a:'Q1',b:'C'},{a:'P',b:'C',auxiliary:true},{a:'Q',b:'C',auxiliary:true}],
    relations:[
      {kind:'between',refs:['B','A1','C'],source:'A1 lies on side BC'},
      {kind:'between',refs:['A','B1','C'],source:'B1 lies on side AC'},
      {kind:'between',refs:['A','P','A1'],source:'P lies on segment AA1'},
      {kind:'collinear',refs:['B','Q','B1'],source:'Q lies on BB1'},
      {kind:'between',refs:['B','Q','B1'],source:'Q lies on segment BB1'},
      {kind:'parallel',refs:['P','Q','A','B'],source:'PQ is parallel to AB'},
      {kind:'between',refs:['P','B1','P1'],source:'B1 is strictly between P and P1'},
      {kind:'between',refs:['Q','A1','Q1'],source:'A1 is strictly between Q and Q1'},
      {kind:'equalAngle',refs:['P','P1','C','B','A','C'],source:'angle PP1C = angle BAC'},
      {kind:'equalAngle',refs:['C','Q1','Q','C','B','A'],source:'angle CQ1Q = angle CBA'}
    ],
    constructions:['Join CP and CQ to compare angles using the given parallel lines. The circle through P, Q, P1 and Q1 is the conclusion to prove, not an assumed object.'],unresolved:[]
  }));
}
