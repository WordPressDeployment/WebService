import os, tempfile, pytest, logging, unittest
from werkzeug.security import check_password_hash, generate_password_hash

from App.main import create_app
from App.database import db, create_db
from App.models import User
from App.models import EventMeta
from App.controllers import (
    create_user,
    get_all_users_json,
    login,
    get_user,
    get_user_by_username,
    update_user,
    get_all_event_json,
    get_client_events_json,
    get_event_id,
    update_event
)


LOGGER = logging.getLogger(__name__)

"""
   Unit Tests
"""
class UserUnitTests(unittest.TestCase):

    def test_new_user(self):
        user = User("bob", "bobpass",5)
        assert user.username == "bob"

    # pure function no side effects or integrations called
    def test_get_json(self):
        user = User("bob", "bobpass",5)
        user_json = user.get_json()
        self.assertDictEqual(user_json, {"id":None, "username":"bob", "level":5})
    
    def test_hashed_password(self):
        password = "mypass"
        hashed = generate_password_hash(password, method="sha256")
        user = User("bob", password,5)
        assert user.password != password

    def test_check_password(self):
        password = "mypass"
        user = User("bob", password,5)
        assert user.check_password(password)

"""
    Integration Tests
"""

# This fixture creates an empty database for the test and deletes it after the test
# scope="class" would execute the fixture once and resued for all methods in the class
@pytest.fixture(autouse=True, scope="module")
def empty_db():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///test.db"})
    create_db()
    yield app.test_client()
    db.drop_all()


def test_authenticate():
    user = create_user("bob", "bobpass",5)
    assert login("bob", "bobpass") != None

class UsersIntegrationTests(unittest.TestCase):

    def test_create_user(self):
        user = create_user("rick", "bobpass",5)
        assert user.username == "rick"

    def test_get_all_users_json(self):
        users_json = get_all_users_json()
        self.assertListEqual([{"id":1, "username":"bob","level":5}, {"id":2, "username":"rick","level":5}], users_json)

    # Tests data changes in the database
    def test_update_user(self):
        update_user(1, "ronnie")
        user = get_user(1)
        assert user.username == "ronnie"
        

class EventsIntergationTest(unittest.TestCase):
    
    def test_get_all_events_json(self):
        event_json = get_all_event_json()
        expected_data = [
            {"room_id": "bob", "sysUUID": "One love", "lastrowid": 39, "sid": 697, "score": 9, "timestamp": 1713398232, "duration": 17, "ts": 47, "cott_id": None},
        ]
        self.assertListEqual(expected_data, event_json)
   
    def test_create_event(self):
        event_meta  = EventMeta("bob","One love",39,697,9,1713398232,17,47,None)
        db.session.add(event_meta)
        db.session.commit()
        assert event_meta.room_id == "bob"
    
    def test_update_event(self):
        event_data ={ 
           "cott_id":"Hotaru no Hikari",  
           "sysUUID":"Sign"         
        }
        event= get_event_id(1) 
        update_event(1, event_data)
        assert event.cott_id == "Hotaru no Hikari"
        assert event.sysUUID == "Sign"



