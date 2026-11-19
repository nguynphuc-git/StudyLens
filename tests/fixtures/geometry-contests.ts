import type {ProofScene} from '../../src/geometry-proof';
export const incenterPastedProblem=`Problem 4. Let ABC be a triangle with AB= AC. The angle bisectors of ̸ CAB and ̸ ABC
meet the sides BC and CA at D and E, respectively. Let K be the incentre of triangle ADC.
Suppose that ̸ BEK = 45◦. Find all possible values of ̸ CAB.`;
export const imo2019PastedProblem=`Problem 2. In triangle ABC, point A1 lies on side BC and point B1 lies on side AC. Let P and Q
be points on segments AA1 and BB1, respectively, such that P Q is parallel to AB. Let P1 be a point
on line P B1, such that B1 lies strictly between P and P1, and ∠P P1C= ∠BAC. Similarly, let Q1
be a point on line QA1, such that A1 lies strictly between Q and Q1, and ∠CQ1Q= ∠CBA.
Prove that points P , Q, P1, and Q1 are concyclic.`;
// Exact PDF text reported by the user, including flattened superscripts.
export const imo1970PastedProblem=`In the tetrahedron ABCD, angle BDC is a right angle. Suppose that the
foot H of the perpendicular from D to the plane ABC is the intersection of
the altitudes of ∆ABC. Prove that
(AB + BC + CA)2 ≤ 6(AD2 + BD2 + CD2).
For what tetrahedra does equality hold?`;
// Paraphrased inputs. Sources and evaluation boundaries: docs/geometry-proof-validation.md.
export const contestProofs=[
  {id:'IMO-1968-P4',dimension:'3D',source:'https://www.imo-official.org/assets/documents/problems/1968/1968_eng.pdf',statement:'For an arbitrary tetrahedron ABCD, prove the existence of a vertex whose three incident edge lengths satisfy all strict triangle inequalities.',checks:['arbitrary tetrahedron','existence of a vertex','strict inequalities','no regularity assumption']},
  {id:'IMO-1970-P5',dimension:'3D',source:'https://www.imo-official.org/assets/documents/problems/1970/1970_eng.pdf',statement:'In tetrahedron ABCD, DB is perpendicular to DC. The perpendicular projection H of D onto plane ABC is also the orthocenter of triangle ABC. Prove (AB+BC+CA)^2 <= 6(AD^2+BD^2+CD^2), and characterize equality.',checks:['right angle BDC','H is a plane foot and orthocenter','inequality','equality case']},
  {id:'ASMO-2022-Secondary-P25',dimension:'2D',source:'https://drive.google.com/file/d/1K4iV1-ueLUCpTjMdWUqAZ-0hqmuRudaP/view',statement:'A trapezoid ABCD has right angles at A and B, with AB = AD and BC = 2 AB. M bisects CD, and I is the intersection of AC and BM. Determine AD^2/IM^2.',checks:['right angles at A and B','BC twice AB','midpoint M','intersection I','ratio 10']}
] as const;
export function imo1970Scene(a=2,b=3,c=4):ProofScene {
  return {dimension:'3D',givens:['DB is perpendicular to DC.','H is the projection of D on ABC and the orthocenter of ABC.'],goal:contestProofs[1].statement.split('Prove ')[1],points:[{id:'D',kind:'free',xyz:[0,0,0]},{id:'A',kind:'free',xyz:[a,0,0]},{id:'B',kind:'free',xyz:[0,b,0]},{id:'C',kind:'free',xyz:[0,0,c]},{id:'H',kind:'planeFoot',refs:['D','A','B','C']}],circles:[],edges:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'A',hidden:true},{a:'D',b:'A'},{a:'D',b:'B'},{a:'D',b:'C'},{a:'D',b:'H',auxiliary:true},{a:'A',b:'H',auxiliary:true},{a:'B',b:'H',auxiliary:true}],relations:[{kind:'perpendicular',refs:['D','B','D','C'],source:'DB perpendicular to DC'},{kind:'perpendicular',refs:['D','H','A','B'],source:'DH perpendicular to ABC'},{kind:'perpendicular',refs:['D','H','A','C'],source:'DH perpendicular to ABC'},{kind:'perpendicular',refs:['A','H','B','C'],source:'H is orthocenter'},{kind:'perpendicular',refs:['B','H','A','C'],source:'H is orthocenter'}],constructions:['Draw DH and the altitude lines AH, BH. Use both perpendicularity hypotheses before applying Pythagoras.'],unresolved:[]};
}
export function asmo2022Scene():ProofScene {
  return {dimension:'2D',givens:['ABCD has right angles at A and B.','AB = AD and BC = 2 AB.','M is the midpoint of CD; I = AC intersect BM.'],goal:'Determine AD^2/IM^2.',points:[{id:'A',kind:'free',xyz:[0,0,0]},{id:'B',kind:'free',xyz:[0,1,0]},{id:'C',kind:'free',xyz:[2,1,0]},{id:'D',kind:'free',xyz:[1,0,0]},{id:'M',kind:'midpoint',refs:['C','D']},{id:'I',kind:'intersection',refs:['A','C','B','M']}],circles:[],edges:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'D'},{a:'D',b:'A'},{a:'A',b:'C'},{a:'B',b:'M'}],relations:[{kind:'perpendicular',refs:['A','B','A','D'],source:'right angle A'},{kind:'perpendicular',refs:['B','A','B','C'],source:'right angle B'},{kind:'equalLength',refs:['A','B','A','D'],source:'AB = AD'}],constructions:[],unresolved:[]};
}
