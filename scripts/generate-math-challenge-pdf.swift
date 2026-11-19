import AppKit
import CoreGraphics
import Foundation

struct Problem {
    let title: String
    let body: String
}

let problems: [Problem] = [
    .init(title: "Exercise 1 · Cauchy sequences and subsequences", body: """
    Let (aₙ) be a real sequence such that |aₙ₊₁ − aₙ| ≤ 1/n² for every n ≥ 1.
    (a) Prove that (aₙ) is Cauchy and determine an explicit upper bound for |aₘ − aₙ| when m > n.
    (b) If aₙₖ → L for a strictly increasing sequence (nₖ), prove that aₙ → L.
    """),
    .init(title: "Exercise 2 · Uniform convergence", body: """
    For x ∈ [0,1], define fₙ(x) = n x/(1+n²x²).
    (a) Find the pointwise limit f and prove pointwise convergence, including at x = 0.
    (b) Decide whether the convergence is uniform by computing sup₀≤x≤1 |fₙ(x)−f(x)|.
    (c) Determine whether ∫₀¹ fₙ(x) dx converges to ∫₀¹ f(x) dx, and justify your answer.
    """),
    .init(title: "Exercise 3 · Infinite series", body: """
    For α ∈ ℝ, consider Σₙ₌₂∞ (−1)ⁿ/(n^α + (log n)²).
    (a) Determine exactly for which α the series converges absolutely.
    (b) Determine exactly for which α it converges conditionally or diverges.
    (c) State which comparison or alternating-series hypotheses you use at each boundary case.
    """),
    .init(title: "Exercise 4 · Complex roots and parameters", body: """
    Let pₐ(z) = z⁴ − 2a z² + 1, where a ∈ ℝ.
    (a) Find all roots in terms of a, including multiplicities when roots coincide.
    (b) Determine all a for which every root lies on the unit circle |z| = 1.
    (c) For those a, calculate the product of the roots with positive imaginary part.
    """),
    .init(title: "Exercise 5 · Implicit differentiation", body: """
    The curve x² + xy + y² = 7 passes through (1,2).
    (a) Find dy/dx and the tangent line at (1,2).
    (b) Find d²y/dx² at that point, showing how the implicit equation is differentiated twice.
    (c) Determine whether the curve is locally the graph of y as a function of x there.
    """),
    .init(title: "Exercise 6 · An integral with a parameter", body: """
    For a > 0, define F(a) = ∫₀∞ e^(−ax) sin(x)/x dx.
    (a) Justify differentiating under the integral sign on any compact interval of positive a.
    (b) Find F′(a), then use limₐ→∞ F(a) = 0 to determine F(a).
    (c) Explain why substituting a = 0 directly into the differentiated integral is not justified by your argument.
    """),
    .init(title: "Exercise 7 · Constrained optimization", body: """
    Find the global maximum and minimum of f(x,y) = xy on x² + 4y² = 8.
    (a) Use Lagrange multipliers and check every critical point.
    (b) Independently verify the extrema using u = x and v = 2y.
    (c) State all equality cases and explain why compactness guarantees global extrema.
    """),
    .init(title: "Exercise 8 · Taylor's theorem with remainder", body: """
    Approximate √(1.04) using the degree-3 Taylor polynomial of g(x) = √(1+x) at x = 0.
    (a) Write the polynomial with exact rational coefficients.
    (b) Use a valid fourth-derivative remainder bound to prove the absolute error is less than 10⁻⁶.
    (c) Explain why the bound must hold on the entire interval [0,0.04], not just at x = 0.
    """),
    .init(title: "Exercise 9 · Improper integrals", body: """
    For p,q ∈ ℝ, determine when I(p,q) = ∫₀¹ x^(−p)|log x|^(−q) dx converges.
    (a) Give the complete condition, including the boundary case p = 1.
    (b) Make the substitution t = −log x and reduce the question to an integral on [0,∞).
    (c) Evaluate I(p,q) when p < 1 and q = 0.
    """),
    .init(title: "Exercise 10 · Eigenvalues and diagonalization", body: """
    Let A = [[2,1,0],[0,2,1],[0,0,2]].
    (a) Find the characteristic polynomial, eigenvalues, and eigenspace dimensions.
    (b) Decide whether A is diagonalizable over ℝ, giving a proof.
    (c) Find the minimal polynomial and compute Aⁿ for integer n ≥ 1 in closed form.
    """),
    .init(title: "Exercise 11 · Orthogonal projections", body: """
    Let u = (1,1,0) and v = (1,0,1) in ℝ³ with the usual inner product.
    (a) Find the matrix of the orthogonal projection onto span{u,v}.
    (b) Verify Pᵀ = P and P² = P directly.
    (c) Find ker(P), im(P), and the distance from (1,2,3) to the plane.
    """),
    .init(title: "Exercise 12 · Rank depending on a parameter", body: """
    Let Mₐ = [[1,1,1],[1,a,2],[1,2,a]].
    (a) Compute det(Mₐ) and determine the rank for every real a.
    (b) At each singular value, find a basis for the nullspace.
    (c) Solve Mₐx = (1,2,3)ᵀ when a = 2, or prove that no solution exists.
    """),
    .init(title: "Exercise 13 · Conditional probability", body: """
    A disease has prevalence 0.02. A test has sensitivity 0.95 and specificity 0.90.
    (a) Find P(disease | positive) and P(no disease | negative).
    (b) A second conditionally independent test is positive. Recalculate the posterior probability.
    (c) Explain why sensitivity alone is not the probability that a positive patient is ill.
    """),
    .init(title: "Exercise 14 · Covariance and correlation", body: """
    Random variables X,Y have E[X]=1, E[Y]=2, Var(X)=4, Var(Y)=9, and Cov(X,Y)=−3.
    (a) Compute Var(2X−Y) and Corr(X,Y).
    (b) Find Cov(X+Y, X−Y).
    (c) Determine whether these moments imply that X and Y are independent; justify carefully.
    """),
    .init(title: "Exercise 15 · Recurrences and generating functions", body: """
    Define a₀=0, a₁=1 and aₙ₊₂=3aₙ₊₁−2aₙ for n ≥ 0.
    (a) Find the ordinary generating function A(x)=Σₙ₌₀∞aₙxⁿ.
    (b) Obtain a closed formula for aₙ and prove it satisfies the initial conditions.
    (c) Find the least n such that aₙ > 10⁶, with a proof of minimality.
    """),
    .init(title: "Exercise 16 · Markov chains", body: """
    A two-state Markov chain has transition matrix P = [[0.8,0.2],[0.3,0.7]].
    (a) Find its stationary distribution and verify πP=π.
    (b) Starting in state 1, find the probability of being in state 2 after exactly 3 steps.
    (c) Determine the limit of Pⁿ and explain which convergence theorem applies.
    """),
    .init(title: "Exercise 17 · Congruences and the Chinese remainder theorem", body: """
    Solve the system x ≡ 2 (mod 9), x ≡ 5 (mod 14), x ≡ 1 (mod 5).
    (a) Find the unique solution modulo the least common multiple of the moduli.
    (b) Prove uniqueness in that modulus.
    (c) Find the smallest positive solution satisfying x > 1000.
    """),
    .init(title: "Exercise 18 · Jensen's inequality and equality", body: """
    Let x,y,z > 0 and xyz = 1.
    (a) Prove x/(1+x) + y/(1+y) + z/(1+z) ≥ 3/2.
    (b) State the convexity/concavity argument and identify its domain.
    (c) Determine all equality cases and explain why replacing xyz=1 by xyz≥1 changes the argument.
    """),
    .init(title: "Exercise 19 · Polynomial interpolation", body: """
    Find the polynomial p of degree at most 3 satisfying p(−1)=2, p(0)=1, p(1)=0, and p(2)=5.
    (a) Compute p using Lagrange interpolation.
    (b) Verify all four data values and determine whether deg(p)=3.
    (c) Find the remainder when p(x) is divided by x²−1.
    """),
    .init(title: "Exercise 20 · A coupled differential system", body: """
    Solve X′ = AX with A = [[0,1],[−2,−3]] and X(0)=(1,0)ᵀ.
    (a) Find the eigenvalues and a fundamental solution.
    (b) Give x(t), y(t) explicitly and verify the initial condition.
    (c) Classify the equilibrium at the origin and justify its asymptotic stability.
    """),
    .init(title: "Exercise 21 · Fourier series and convergence", body: """
    Let f(x)=x on (−π,π), extended periodically with period 2π.
    (a) Compute its Fourier coefficients and write its Fourier series.
    (b) State the pointwise sum at x=0 and x=π.
    (c) Use Parseval's identity to derive Σₙ₌₁∞ 1/n² = π²/6.
    """),
    .init(title: "Exercise 22 · Conic sections and tangents", body: """
    Consider the ellipse 4x²+9y²=36.
    (a) Find its foci, eccentricity, and tangent line at (3/2, √3).
    (b) Find the points where the tangent has slope −1.
    (c) Prove that the sum of distances from any point on the ellipse to the two foci is constant.
    """),
    .init(title: "Exercise 23 · Change of variables and area", body: """
    Let R={(x,y): 1≤x²+y²≤4, y≥0, x≥0} and evaluate ∬R (x²+y²) dA.
    (a) Express R in polar coordinates and include the Jacobian.
    (b) Evaluate the integral exactly.
    (c) Explain why omitting the factor r gives a dimensionally and numerically incorrect result.
    """),
    .init(title: "Exercise 24 · Convexity, logarithms, and optimization", body: """
    For x>0, determine the global minimum of h(x)=x−1−ln x.
    (a) Prove h(x)≥0 using derivatives and identify equality.
    (b) Prove the same inequality using ln x≤x−1, deriving that inequality from concavity of ln.
    (c) Determine whether h is strictly convex on (0,∞), and justify your conclusion.
    """)
]

let output = CommandLine.arguments.dropFirst().first
    ?? "public/advanced-math-challenge.pdf"
let pageWidth: CGFloat = 612
let pageHeight: CGFloat = 792
let margin: CGFloat = 54
let bodyWidth = pageWidth - 2 * margin
let groups = stride(from: 0, to: problems.count, by: 4).map {
    Array(problems[$0..<min($0 + 4, problems.count)])
}
let outputData = NSMutableData()
var mediaBox = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
guard let consumer = CGDataConsumer(data: outputData as CFMutableData),
      let context = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else {
    fatalError("Could not create the PDF context.")
}

func draw(_ text: String, at origin: CGPoint, width: CGFloat, font: NSFont, color: NSColor,
          lineSpacing: CGFloat = 4) -> CGFloat {
    let paragraph = NSMutableParagraphStyle()
    paragraph.lineSpacing = lineSpacing
    paragraph.paragraphSpacing = 3
    let attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ]
    let attributed = NSAttributedString(string: text, attributes: attributes)
    let measured = attributed.boundingRect(
        with: CGSize(width: width, height: .greatestFiniteMagnitude),
        options: [.usesLineFragmentOrigin, .usesFontLeading]
    )
    attributed.draw(in: CGRect(x: origin.x, y: origin.y, width: width, height: ceil(measured.height) + 2))
    return ceil(measured.height) + 2
}

for (pageIndex, group) in groups.enumerated() {
    context.beginPDFPage(nil)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)

    let title = pageIndex == 0 ? "Advanced Mathematics Challenge" : "Advanced Mathematics Challenge · Continued"
    var y = margin
    y += draw(title, at: CGPoint(x: margin, y: y), width: bodyWidth,
              font: .boldSystemFont(ofSize: 23), color: NSColor(calibratedRed: 0.12, green: 0.28, blue: 0.22, alpha: 1), lineSpacing: 2)
    y += 5
    y += draw("24 multi-step problems · 6 pages · Show complete reasoning and check all hypotheses.",
              at: CGPoint(x: margin, y: y), width: bodyWidth,
              font: .systemFont(ofSize: 10.5), color: .darkGray, lineSpacing: 2)
    if pageIndex == 0 {
        y += 10
        y += draw("Instructions: Answer every part. Give exact values where possible. State the theorem used, verify boundary/equality cases, and do not rely on a calculator for proofs.",
                  at: CGPoint(x: margin, y: y), width: bodyWidth,
                  font: .systemFont(ofSize: 10.5), color: .darkGray, lineSpacing: 3)
    }
    y += 12

    for (offset, problem) in group.enumerated() {
        let number = pageIndex * 4 + offset + 1
        let headingHeight = draw(problem.title, at: CGPoint(x: margin, y: y), width: bodyWidth,
                                 font: .boldSystemFont(ofSize: 12.5), color: NSColor(calibratedRed: 0.22, green: 0.39, blue: 0.29, alpha: 1), lineSpacing: 2)
        y += headingHeight + 3
        let bodyHeight = draw(problem.body, at: CGPoint(x: margin + 10, y: y), width: bodyWidth - 10,
                              font: .systemFont(ofSize: 10.8), color: .black, lineSpacing: 3)
        y += bodyHeight + 13
        if y > pageHeight - margin - 24 {
            fputs("Problem \(number) exceeded the page's safe layout area.\n", stderr)
            exit(1)
        }
    }

    let footer = "StudyLens PDF import test  ·  Page \(pageIndex + 1) of \(groups.count)"
    _ = draw(footer, at: CGPoint(x: margin, y: pageHeight - margin + 8), width: bodyWidth,
             font: .systemFont(ofSize: 9), color: .gray, lineSpacing: 1)

    NSGraphicsContext.restoreGraphicsState()
    context.endPDFPage()
}

context.closePDF()
try outputData.write(to: URL(fileURLWithPath: output), options: .atomic)
print("Created \(output) with \(problems.count) exercises across \(groups.count) pages.")
