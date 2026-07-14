import unittest

from script.pact_swebench_pro_oracle import reward_from_result


class SWEbenchProOracleTest(unittest.TestCase):
    def test_uses_the_strictest_numeric_reward(self):
        self.assertEqual(
            reward_from_result({"verifier_result": {"rewards": {"reward": 1, "secondary": 0.5}}}),
            0.5,
        )

    def test_missing_reward_is_zero(self):
        self.assertEqual(reward_from_result({}), 0.0)


if __name__ == "__main__":
    unittest.main()
