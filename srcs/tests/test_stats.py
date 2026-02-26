#!/usr/bin/env python3
"""
Tests fonctionnels CI/CD - GET /api/game/stats
"""
import sys
import time

from test_helpers import (
    TestSession,
    generate_test_credentials,
    print_test,
    print_success,
    print_error,
    API_URL,
)


class SkipTest(Exception):
    pass


def test_1_stats_unauthenticated():
    """Test: /api/game/stats est accessible sans auth (route publique via gateway)"""
    print_test("STATS - accès sans authentification")
    session = TestSession()
    resp = session.get("/game/stats", expected_status=200)
    data = resp.json()
    assert isinstance(data, list), f"Expected list, got: {type(data)}"
    print_success(f"Route /api/game/stats accessible, {len(data)} tournament(s) retourné(s)")


def test_2_stats_returns_correct_fields():
    """Test: chaque entrée contient les champs attendus"""
    print_test("STATS - structure des données retournées")
    session = TestSession()

    # Create a tournament first so there's at least one entry
    creds = generate_test_credentials()
    session.session.post(f"{API_URL}/auth/register", json=creds, verify=False)
    session.session.post(f"{API_URL}/auth/login", json=creds, verify=False)
    session.post("/game/create-tournament", json={})

    resp = session.get("/game/stats", expected_status=200)
    data = resp.json()
    assert len(data) > 0, "Expected at least 1 tournament in stats"

    expected_fields = {"tournament_id", "status", "creator", "player_count", "match_count", "winner", "created_at"}
    for row in data:
        missing = expected_fields - set(row.keys())
        assert not missing, f"Missing fields: {missing} in row {row}"

    print_success(f"Tous les champs présents dans {len(data)} tournoi(s)")


def test_3_stats_after_tournament_with_4_players():
    """Test: stats reflètent correctement un tournoi avec 4 joueurs"""
    print_test("STATS - stats après tournoi avec 4 joueurs")
    timestamp = int(time.time())
    session = TestSession()

    creds = generate_test_credentials()
    session.session.post(f"{API_URL}/auth/register", json=creds, verify=False)
    session.session.post(f"{API_URL}/auth/login", json=creds, verify=False)
    tour_resp = session.post("/game/create-tournament", json={})
    tour_id = tour_resp.json()

    for i in range(3):
        c = {
            "username": f"st_{timestamp}_{i}",
            "email": f"st_{timestamp}_{i}@test.local",
            "password": "ValidPass123!",
        }
        session.session.post(f"{API_URL}/auth/register", json=c, verify=False)
        session.session.post(f"{API_URL}/auth/login", json=c, verify=False)
        session.post(f"/game/tournaments/{tour_id}", json={})

    resp = session.get("/game/stats", expected_status=200)
    data = resp.json()

    matching = [r for r in data if r["tournament_id"] == tour_id]
    assert len(matching) == 1, f"Tournament {tour_id} not found in stats"

    row = matching[0]
    assert row["player_count"] == 4, f"Expected 4 players, got {row['player_count']}"
    assert row["status"] == "STARTED", f"Expected STARTED, got {row['status']}"
    assert row["match_count"] >= 2, f"Expected at least 2 matches, got {row['match_count']}"

    print_success(f"Tournoi {tour_id}: {row['player_count']} joueurs, {row['match_count']} matchs, status={row['status']}")


def main():
    print("\n" + "=" * 60)
    print("🚀 Tests CI/CD - Stats route")
    print("=" * 60)

    tests = [
        test_1_stats_unauthenticated,
        test_2_stats_returns_correct_fields,
        test_3_stats_after_tournament_with_4_players,
    ]

    test_dict = {str(i + 1).zfill(2): t for i, t in enumerate(tests)}

    target_test = None
    if len(sys.argv) > 1:
        arg = sys.argv[1].zfill(2)
        if arg in test_dict:
            target_test = arg
        else:
            print_error(f"Test n°{arg} introuvable. Disponibles: {', '.join(sorted(test_dict.keys()))}")
            sys.exit(1)

    tests_to_run = [(target_test, test_dict[target_test])] if target_test \
        else [(k, test_dict[k]) for k in sorted(test_dict.keys())]

    passed = failed = skipped = 0
    for num, fn in tests_to_run:
        print(f"\n[TEST {num}] ", end="")
        try:
            fn()
            passed += 1
        except SkipTest:
            skipped += 1
        except AssertionError as e:
            failed += 1
            print_error(f"FAILED: {e}")
        except Exception as e:
            failed += 1
            print_error(f"ERROR: {e}")

    print("\n" + "=" * 60)
    print(f"📊 Résultats: {passed} réussis, {failed} échoués, {skipped} ignorés")
    print("=" * 60 + "\n")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()