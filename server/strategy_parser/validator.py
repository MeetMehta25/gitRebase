def validate_strategy(strategy):

    required_fields = [
        "ticker",
        "indicators",
        "entry_conditions",
        "exit_conditions"
    ]

    for field in required_fields:

        if field not in strategy:

            raise ValueError(f"Missing field: {field}")

    if not isinstance(strategy["entry_conditions"], list):

        raise ValueError("Entry conditions must be list")

    return True