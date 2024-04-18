from flask_sqlalchemy import SQLAlchemy
from App.database import db 


class EventMeta(db.Model):
    __tablename__ = 'event_meta'

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.String(120), nullable=False)
    sysUUID = db.Column(db.String(120), nullable=False)
    lastrowid = db.Column(db.Integer, nullable=False)
    sid = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    ts = db.Column(db.Integer, nullable=False)
    cott_id = db.Column(db.String(200), nullable=True)

    def __init__(self, room_id, sysUUID, lastrowid, sid, score, timestamp, duration, ts, cott_id):
        self.room_id = room_id
        self.sysUUID = sysUUID
        self.lastrowid = lastrowid
        self.sid = sid
        self.score = score
        self.timestamp = timestamp
        self.duration = duration
        self.ts = ts
        self.cott_id = cott_id

    def get_json(self):
        return {
            'room_id': self.room_id,
            'sysUUID': self.sysUUID,
            'lastrowid': self.lastrowid,
            'sid': self.sid,
            'score': self.score,
            'timestamp': self.timestamp,
            'duration': self.duration,
            'ts': self.ts,
            'cott_id': self.cott_id
        }
