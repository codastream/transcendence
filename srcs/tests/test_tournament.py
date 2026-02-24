#!/usr/bin/env python3
"""
Tests fonctionnels CI/CD - Service Game (Tournaments)  
Tests: Tournament creation, joining, capacity limits  
"""
import sys
import time
import pyotp
from requests import status_codes


class SkipTest(Exception):
    """Exception pour skipper un test sans arrêter l'exécution"""

    pass


from test_helpers import (
    TestSession,
    generate_test_credentials,
    print_test,
    print_success,
    print_error,
    API_URL,
)

def test_1_create_4_users_and_a_tournament():
    """Test: création d'un tournoi avec 4 joueurs"""
    print_test("GAME - création d'un tournoi avec 4 joueurs")

    session = TestSession()
    import time

    start_time = time.time()


    # Créer 100 utilisateurs avec des noms uniques basés sur timestamp
    timestamp = int(time.time())
    
    creds = generate_test_credentials()
    resp = session.session.post(
        f"{API_URL}/auth/register", json=creds, verify=False
    )
    resp = session.session.post(
        f"{API_URL}/auth/login", json=creds, verify=False
    )
    tourId = session.post("/game/create-tournament", json=creds)
    print(f"- id du tournoi :{tourId.json()}")

    for i in range(3):
        creds = {
            "username": f"{timestamp}_{i}",
            "email": f"{timestamp}_{i}@test.local",
            "password": "ValidPass123!",
        }

        try:
            resp = session.session.post(
                f"{API_URL}/auth/register", json=creds, verify=False
            )
            resp = session.session.post(
                f"{API_URL}/auth/login", json=creds, verify=False
            )
            resp = session.post(f"{API_URL}/game/tournaments/{tourId.json()}", json=creds)
            print(f"code:{resp.status_code},{resp.json()}");
        except Exception as e:
            print(f"Error : {e.args}")

    total_time = time.time() - start_time

    print(f"   ⏱️  Temps total: {total_time:.2f} secondes")
    print_success("création d'un tournoi avec 4 joueurs")

def test_2_create_5_users_and_a_tournament():
    """Test: création d'un tournoi avec 4 joueurs et ajout d'un 5eme"""
    print_test("GAME - création d'un tournoi avec 5 joueurs")

    session = TestSession()
    import time

    start_time = time.time()


    # Créer 100 utilisateurs avec des noms uniques basés sur timestamp
    timestamp = int(time.time())
    
    creds = generate_test_credentials()
    resp = session.session.post(
        f"{API_URL}/auth/register", json=creds, verify=False
    )
    resp = session.session.post(
        f"{API_URL}/auth/login", json=creds, verify=False
    )
    tourId = session.post("/game/create-tournament", json=creds)
    print(f"- id du tournoi :{tourId.json()}")

    for i in range(3):
        creds = {
            "username": f"{timestamp}_{i}",
            "email": f"{timestamp}_{i}@test.local",
            "password": "ValidPass123!",
        }

        try:
            resp = session.session.post(
                f"{API_URL}/auth/register", json=creds, verify=False
            )
            resp = session.session.post(
                f"{API_URL}/auth/login", json=creds, verify=False
            )
            resp = session.post(f"{API_URL}/game/tournaments/{tourId.json()}", json=creds)
            print(f"code:{resp.status_code},{resp.json()}");
        except Exception as e:
            print(f"Error : {e.args}")
    creds = {
        "username": f"{timestamp}_tour",
        "email": f"{timestamp}_tour@test.local",
        "password": "ValidPass123!",
    }
    resp = session.session.post(
        f"{API_URL}/auth/register", json=creds, verify=False
    )
    resp = session.session.post(
        f"{API_URL}/auth/login", json=creds, verify=False
    )
    resp = session.post(f"{API_URL}/game/tournaments/{tourId.json()}", json=creds, expected_status=409)
    print(f"⚠️  Ajout du 5eme joueur: code:{resp.status_code},{resp.json()}\n");

    total_time = time.time() - start_time

    print(f"   ⏱️  Temps total: {total_time:.2f} secondes")
    print_success("création d'un tournoi avec 5 joueurs lance une erreur")

def main():
    """Exécution de tous les tests"""
    print("\n" + "=" * 60)
    print("🚀 Tests CI/CD - Tournament management")
    print("=" * 60)

    tests = [
        test_1_create_4_users_and_a_tournament,
        test_2_create_5_users_and_a_tournament
    ]

    test_dict = {}
    for t in tests:
        num = t.__name__.split('_')[1]
        test_dict[num] = t

    target_test = None
    if len(sys.argv) > 1:
        arg = sys.argv[1].zfill(2) # Ajoute un 0 devant si l'utilisateur tape "1" au lieu de "01"
        if arg in test_dict:
            target_test = arg
        else:
            print_error(f"Erreur : Le test n°{arg} n'existe pas.")
            print(f"Tests disponibles : {', '.join(sorted(test_dict.keys()))}")
            sys.exit(1)

    print("\n" + "=" * 60)
    if target_test:
        print(f"Exécution du test spécifique : {target_test}")
        tests_to_run = [(target_test, test_dict[target_test])]
    else:
        print("Exécution de tous les tests CI/CD")
        tests_to_run = [(num, test_dict[num]) for num in sorted(test_dict.keys())]
    print("=" * 60)

    passed = 0
    failed = 0
    skipped = 0

    for num, test_func in tests_to_run:
        # On affiche explicitement l'ID du test avant son exécution
        print(f"\n[TEST {num}]", end=" ")
        try:
            test_func()
            passed += 1
        except SkipTest as e:
            skipped += 1
            # Message déjà affiché par la fonction skip
        except AssertionError as e:
            failed += 1
            print_error(f"FAILED: {str(e)}")
        except Exception as e:
            failed += 1
            print_error(f"ERROR: {str(e)}")

    print("\n" + "=" * 60)
    print(f"📊 Résultats: {passed} réussis, {failed} échoués, {skipped} ignorés")
    print("=" * 60 + "\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()

