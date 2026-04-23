from typing import List


def validate_probabilities(probabilities: List[float]) -> None:
    if not probabilities:
        raise ValueError("You must provide at least one probability.")

    for prob in probabilities:
        if not 0 <= prob <= 1:
            raise ValueError(f"Invalid probability {prob}. Must be between 0 and 1.")


def multiply_probabilities(probabilities: List[float]) -> float:
    validate_probabilities(probabilities)

    result = 1.0
    for prob in probabilities:
        result *= prob

    return round(result, 4)


def apply_parlay_penalty(
    parlay_probability: float,
    num_bets: int,
    penalty_per_extra_bet: float = 0.02
) -> float:
    """
    Optional extra penalty for larger parlays.

    Example:
    2 bets -> 1 extra bet -> 2% penalty
    3 bets -> 2 extra bets -> 4% penalty
    """
    if not 0 <= parlay_probability <= 1:
        raise ValueError("Parlay probability must be between 0 and 1.")

    if num_bets < 1:
        raise ValueError("Number of bets must be at least 1.")

    total_penalty = max(0, num_bets - 1) * penalty_per_extra_bet
    adjusted_probability = parlay_probability * (1 - total_penalty)

    return max(0.0, round(adjusted_probability, 4))


def calculate_parlay_probability(
    probabilities: List[float],
    use_penalty: bool = True,
    penalty_per_extra_bet: float = 0.02
) -> float:
    validate_probabilities(probabilities)

    parlay_probability = multiply_probabilities(probabilities)

    if use_penalty:
        return apply_parlay_penalty(
            parlay_probability,
            len(probabilities),
            penalty_per_extra_bet
        )

    return parlay_probability


def evaluate_parlay_bet(probability: float) -> str:
    if probability > 0.55:
        return "Good Parlay Bet"
    elif probability > 0.35:
        return "Risky but Playable"
    return "Avoid"


if __name__ == "__main__":
    probs = [0.72, 0.64, 0.68]

    parlay_prob = calculate_parlay_probability(probs)

    print("Individual probabilities:", probs)
    print("Parlay probability:", parlay_prob)
    print("Recommendation:", evaluate_parlay_bet(parlay_prob))