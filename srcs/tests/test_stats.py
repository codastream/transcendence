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
    creds = generate_test_credentials()
    session.session.post(f"{API_URL}/auth/register", json=creds, verify=False)
    session.session.post(f"{API_URL}/auth/login", json=creds, verify=False)
    resp = session.get("/game/stats", expected_status=200)
    data = resp.json()
    assert isinstance(data, list), f"Expected list, got: {type(data)}"
    print_success(f"Route /api/game/stats accessible, {len(data)} tournament(s) retourné(s)")


def test_2_stats_returns_correct_fields():
    """Test: chaque entrée contient les champs attendus"""
    print_test("STATS - structure des données retournées")
    session = TestSession()

    creds = generate_test_credentials()
    session.session.post(f"{API_URL}/auth/register", json=creds, verify=False)
    session.session.post(f"{API_URL}/auth/login", json=creds, verify=False)
    session.post("/game/create-tournament", json={})

    resp = session.get("/game/stats", expected_status=200)
    data = resp.json()
    assert len(data) > 0, "Expected at least 1 player in stats"

    expected_fields = {
        "player_id", "username",
        "tournaments_played", "tournaments_won",
        "matches_played", "matches_won",
    }
    for row in data:
        missing = expected_fields - set(row.keys())
        assert not missing, f"Missing fields: {missing} in row {row}"

    print_success(f"Tous les champs présents dans {len(data)} joueur(s)")


def test_3_stats_after_tournament_with_4_players():
    """Test: stats reflètent correctement un tournoi avec 4 joueurs"""
    print_test("STATS - stats après tournoi avec 4 joueurs")
    timestamp = int(time.time())

    # Creator — keep this session alive for the final GET
    creator = TestSession()
    creds = generate_test_credentials()
    creator.session.post(f"{API_URL}/auth/register", json=creds, verify=False)
    creator.session.post(f"{API_URL}/auth/login", json=creds, verify=False)
    tour_id = creator.post("/game/create-tournament", json={}).json()

    # 3 other players — each gets its own session so cookies don't overwrite
    for i in range(3):
        c = {
            "username": f"st_{timestamp}_{i}",
            "email": f"st_{timestamp}_{i}@test.local",
            "password": "ValidPass123!",
        }
        player_session = TestSession()                                              # ← inside loop
        player_session.session.post(f"{API_URL}/auth/register", json=c, verify=False)  # ← inside loop
        player_session.session.post(f"{API_URL}/auth/login", json=c, verify=False)     # ← inside loop
        player_session.post(f"/game/tournaments/{tour_id}", json={})               # ← inside loop

    players = creator.get(f"/game/tournaments/{tour_id}", expected_status=200).json()
    assert len(players) == 4

    # creator session still valid → fetch stats
    print("Cookies:", dict(creator.session.cookies))
    resp = creator.get("/game/stats", expected_status=200)
    data = resp.json()

    matching = [r for r in data if r["username"] == creds["username"]]
    assert len(matching) == 1, f"Creator {creds['username']} not found in stats"

    row = matching[0]
    assert row["tournaments_played"] >= 1, \
        f"Expected >= 1 tournament played, got {row['tournaments_played']}"
    assert row["matches_played"] >= 1, f"Expected >= 1 match played, got {row['matches_played']}"


    print_success(
        f"{row['username']}: {row['tournaments_played']} tournoi(s), "
        f"{row['matches_played']} match(s) joués, {row['matches_won']} gagnés"
    )

def main():
    print("\n" + "=" * 60)
    print("🚀 Tests CI/CD - Stats route")
    print("=" * 60)

    tests = [
        #test_1_stats_unauthenticated,
        #test_2_stats_returns_correct_fields,
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