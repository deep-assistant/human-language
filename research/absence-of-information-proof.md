# Probability of Absence of Information: Formal Proof

## Setup (Axioms / Assumptions)

We work in the standard Kolmogorov framework:

- A probability space $(\Omega,\mathcal F,\mathbb P)$.
- A discrete random variable $X:\Omega\to \mathcal X$ with countable range $\mathcal X$.
- PMF $p(x)=\mathbb P[X=x]$ for $x\in\mathcal X$.
- **Non-degeneracy assumption:** there exist $x\neq y$ with $p(x)>0$ and $p(y)>0$.

Define **self-information** (surprisal) of the realized outcome:

```math
I(X) := -\log p(X)
```

Interpretation: “no information” means $I(X)=0$.

---

## Theorem

If $X$ is non-degenerate (at least two outcomes have positive probability), then

```math
\mathbb P[I(X)=0] = 0
```

---

## Proof

For any $x\in\mathcal X$,

```math
I(x)=0 \iff -\log p(x)=0 \iff p(x)=1
```

Hence the event $\{I(X)=0\}$ is exactly $\{p(X)=1\}$.

Let 

```math
A = \{x \in \mathcal X : p(x)=1\}
```

Then

```math
\mathbb P[I(X)=0] = \sum_{x \in A} \mathbb P[X=x] = \sum_{x \in A} p(x)
```

Under the non-degeneracy assumption, no such $x$ exists, so $A=\varnothing$ and the sum is $0$. ∎

---

## Notes and Variants

### 1) Continuous Random Variables
Let $X$ have density $f$ with respect to a dominating measure $\mu$. Define surprisal:

```math
J(X) := -\log f(X)
```

Then $J(X)=0 \iff f(X)=1$. In ordinary continuous distributions, $\mathbb P[J(X)=0]=0$.

### 2) Zero Info as Degenerate Prior
The proof shows: $I(X)=0$ occurs with positive probability **iff** the distribution is a Dirac measure (all mass on one point).

### 3) Mutual Information Lens
If $\Theta$ is a “world state” and $Y$ is an observation, “no information from $Y$” means $I(\Theta;Y)=0$.  
Under a non-degenerate channel $p(y\mid\theta)$, $I(\Theta;Y)>0$.

---

## Minimal Axioms Used

1. Kolmogorov probability axioms.
2. Definition of a random variable and PMF (or density for continuous case).
3. Calculus fact: $-\log t = 0 \iff t=1$.
4. Non-degeneracy: at least two outcomes with positive probability.

**Conclusion:** In any non-degenerate model, the probability of “no information” (zero surprisal) is 0.