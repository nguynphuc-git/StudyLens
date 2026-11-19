import AppKit
import CoreGraphics
import Foundation

struct Problem {
    let title: String
    let text: String
}

let problems: [Problem] = [
    .init(title: "Sets, quantifiers, and cardinality", text: """
    Let A,B,C ⊆ U, where |U| = 60, |A| = 32, |B| = 29, |C| = 25,
    |A∩B| = 15, |A∩C| = 12, |B∩C| = 11, and |A∩B∩C| = 6.
    Find |A∪B∪C| and |(A△B)∩C|. Prove De Morgan's identity
    (A∪B)ᶜ = Aᶜ∩Bᶜ, and decide whether ∀x∈A ∃y∈B (x<y)
    implies ∃y∈B ∀x∈A (x<y). Give a counterexample if not.
    """),
    .init(title: "Epsilon-delta limits and continuity", text: """
    Define f(x) = (x²−1)/(x−1) for x≠1 and f(1)=k.
    Determine limₓ→₁ f(x) and all k for which f is continuous at x=1.
    For that k, prove directly from ε>0 choose δ>0 that
    limₓ→₁ (x²−1)/(x−1)=2. Then evaluate limₓ→₀ sin(3x)/x.
    """),
    .init(title: "Series tests and boundary cases", text: """
    Classify convergence of sum_{n=1}^∞ (−1)^n n/(n³+1),
    sum_{n=2}^∞ 1/[n(ln n)^p], and sum_{n=0}^∞ (2x−1)^n/(n+1).
    State absolute vs conditional convergence, all parameter ranges,
    and the exact boundary values. Do not infer convergence merely
    because the terms aₙ tend to zero.
    """),
    .init(title: "Improper integrals and parameters", text: """
    For p,q∈ℝ, determine convergence of
    I(p,q)=∫₀¹ x⁻ᵖ|ln x|⁻ᑫ dx, including p=1.
    Evaluate ∫₀∞ e⁻ᵃˣ sin(bx)/x dx for a>0, b∈ℝ.
    Justify each substitution and identify every improper endpoint.
    """),
    .init(title: "Gradient, Hessian, and constrained extrema", text: """
    Let f(x,y)=x²+xy+2y²−4x+2y. Compute ∇f and the Hessian
    H=[∂²f/∂xᵢ∂xⱼ]. Find and classify every critical point using
    the eigenvalues of H. Then find max/min of xy subject to
    g(x,y)=x²+4y²−8=0 using ∇f=λ∇g; check all equality cases.
    """),
    .init(title: "Determinants, rank, and eigenvalues", text: """
    For Aₜ=[[t,1,0],[1,t,1],[0,1,t]], compute det(Aₜ),
    find all t∈ℝ for which rank(Aₜ)<3, and give nullspace bases.
    At t=2, find χA(λ)=det(λI−A), all eigenvalues, and decide
    whether A is diagonalizable. Verify your answer by rank.
    """),
    .init(title: "Complex numbers and roots of unity", text: """
    Write z=−1+i√3 in polar form reⁱᶿ with θ∈(−π,π].
    Find all w∈ℂ satisfying w⁶=64eⁱπ, using De Moivre's theorem.
    Express the roots as a set; identify which satisfy |w|=2,
    and compute Σₖ₌₀⁵ e²πⁱᵏ⁄⁶.
    """),
    .init(title: "Differential equations and initial values", text: """
    Solve y″−3y′+2y=eˣ with y(0)=0 and y′(0)=1.
    Show the characteristic equation r²−3r+2=0, handle resonance,
    and verify the particular solution. Then solve x′=Ax for
    A=[[0,−1],[1,0]], X(0)=(1,0)ᵀ, and prove ‖X(t)‖₂ is constant.
    """),
    .init(title: "Fourier coefficients and Parseval", text: """
    For f(x)=x² on [−π,π], extend f periodically with period 2π.
    Compute a₀, aₙ, bₙ in f(x)~a₀/2+sum_{n=1}^∞(aₙcos nx+bₙsin nx).
    State convergence at x=±π and use Parseval's identity
    (1/π)∫₋ππ|f(x)|²dx=a₀²/2+Σₙ₌₁∞(aₙ²+bₙ²) to find Σ1/n⁴.
    """),
    .init(title: "Probability, Bayes, and covariance", text: """
    Let P(D)=0.01, P(+|D)=0.98, and P(−|Dᶜ)=0.95.
    Find P(D|+) and P(Dᶜ|−) using Bayes' theorem.
    If E[X]=2, E[Y]=−1, Var(X)=4, Var(Y)=9, Cov(X,Y)=−2,
    compute Var(3X−2Y), Corr(X,Y), and Cov(X+Y,X−Y).
    """),
    .init(title: "Recurrences and generating functions", text: """
    Let a₀=2, a₁=5, and aₙ₊₂−4aₙ₊₁+4aₙ=0 for n≥0.
    Find A(x)=Σₙ₌₀∞aₙxⁿ, derive a closed form for aₙ,
    and prove it by substitution. Determine whether
    Σₙ₌₀∞ aₙ/5ⁿ converges and, if so, evaluate its sum.
    """),
    .init(title: "Inequalities, convexity, and equality", text: """
    For x,y,z>0 with xyz=1, prove
    x/(1+x)+y/(1+y)+z/(1+z)≥3/2 and find equality cases.
    State the convexity or algebraic inequality used.
    Then determine all equality cases in
    |⟨u,v⟩|≤‖u‖₂‖v‖₂ for u,v∈ℝⁿ.
    """),
    .init(title: "Double integrals and Jacobians", text: """
    Let R={(x,y):1≤x²+y²≤4, x≥0, y≥0}.
    Evaluate ∬R (x²+y²) dA using x=r cosθ, y=r sinθ
    and the Jacobian |∂(x,y)/∂(r,θ)|=r.
    State the exact r,θ bounds and explain why dA≠dr dθ.
    """),
    .init(title: "Limits, derivatives, and chain rule", text: """
    Let h(x)=ln(1+x²) and q(x)=eˢⁱⁿˣ.
    Find h′(x), h″(x), q′(x), and limₓ→₀ h(x)/x².
    For F(x)=∫₀ˣ t²eᵗ dt, find F′(x) and F″(x);
    state the theorem that justifies differentiating F.
    """),
    .init(title: "Uniform convergence and exchanging limits", text: """
    Set fₙ(x)=xⁿ on [0,1]. Find f(x)=limₙ→∞fₙ(x) pointwise.
    Is convergence uniform? Compute or bound
    supₓ∈[0,1]|fₙ(x)−f(x)|. Compare limₙ→∞∫₀¹fₙ(x)dx
    with ∫₀¹limₙ→∞fₙ(x)dx and explain the failed exchange.
    """),
    .init(title: "Logic, implication, and counterexamples", text: """
    Determine whether each statement is true:
    (i) ∀x∈ℝ, x²≥x; (ii) ∃x∈ℝ, ∀y∈ℝ, x+y=0;
    (iii) P implies Q iff not Q implies not P; (iv) ∀ε>0 ∃N∈ℕ ∀n≥N, |aₙ−L|<ε.
    Negate (iv) using quantifiers and give a sequence disproving it.
    """)
]

let output = CommandLine.arguments.dropFirst().first ?? "public/math-symbols-challenge.pdf"
let pageWidth: CGFloat = 612
let pageHeight: CGFloat = 792
let margin: CGFloat = 48
let width = pageWidth - 2 * margin
let pages = stride(from: 0, to: problems.count, by: 4).map {
    Array(problems[$0..<min($0 + 4, problems.count)])
}
let data = NSMutableData()
var mediaBox = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
guard let consumer = CGDataConsumer(data: data as CFMutableData),
      let context = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else {
    fatalError("Could not create the PDF context.")
}

func draw(_ text: String, x: CGFloat, y: CGFloat, width: CGFloat,
          font: NSFont, color: NSColor) -> CGFloat {
    let paragraph = NSMutableParagraphStyle()
    paragraph.lineSpacing = 3
    paragraph.paragraphSpacing = 3
    let value = NSAttributedString(string: text, attributes: [
        .font: font, .foregroundColor: color, .paragraphStyle: paragraph
    ])
    let size = value.boundingRect(
        with: CGSize(width: width, height: .greatestFiniteMagnitude),
        options: [.usesLineFragmentOrigin, .usesFontLeading]
    )
    let height = ceil(size.height) + 2
    value.draw(in: CGRect(x: x, y: pageHeight - y - height, width: width, height: height))
    return height
}

for (pageIndex, page) in pages.enumerated() {
    context.beginPDFPage(nil)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    var y = margin
    y += draw("Math-Symbol Stress Test", x: margin, y: y, width: width,
              font: .boldSystemFont(ofSize: 23),
              color: NSColor(calibratedRed: 0.12, green: 0.28, blue: 0.22, alpha: 1)) + 4
    y += draw("16 multi-step exercises · Dense notation: ∀ ∃ ∈ ⊆ ∩ ∪ ∑ ∫ ∇ λ ℝ ℂ ⇒ ≤ ‖ ‖",
              x: margin, y: y, width: width, font: .systemFont(ofSize: 10),
              color: .darkGray) + 12
    for (offset, problem) in page.enumerated() {
        let exerciseNumber = pageIndex * 4 + offset + 1
        let heading = draw("Exercise \(exerciseNumber): \(problem.title)", x: margin, y: y, width: width,
                           font: .boldSystemFont(ofSize: 12.5),
                           color: NSColor(calibratedRed: 0.22, green: 0.39, blue: 0.29, alpha: 1))
        y += heading + 3
        let body = draw(problem.text, x: margin + 10, y: y, width: width - 10,
                        font: .systemFont(ofSize: 10.4), color: .black)
        y += body + (offset == page.count - 1 ? 0 : 13)
        if y > pageHeight - margin - 24 {
            fputs("Exercise \(pageIndex * 4 + offset + 1) exceeded the page layout.\n", stderr)
            exit(1)
        }
    }
    _ = draw("StudyLens AI import test · Page \(pageIndex + 1) of \(pages.count)",
             x: margin, y: pageHeight - margin + 8, width: width,
             font: .systemFont(ofSize: 9), color: .gray)
    NSGraphicsContext.restoreGraphicsState()
    context.endPDFPage()
}

context.closePDF()
try data.write(to: URL(fileURLWithPath: output), options: .atomic)
print("Created \(output): \(problems.count) exercises, \(pages.count) pages.")
