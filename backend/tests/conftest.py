"""
Test fixtures.

Uses an in-memory SQLite database so tests are fast and fully isolated.
The fixture creates the schema, seeds all reference data, and provides
a FastAPI TestClient ready for API tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.data.seed import seed_database
from app.models.manufacturer import Manufacturer   # noqa: F401 — needed for Base
from app.models.component import Component          # noqa: F401


TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """
    In-memory SQLite engine.

    StaticPool forces every SQLAlchemy session to reuse the SAME underlying
    connection, so tables created by the engine fixture are visible to every
    subsequent test session — the default pool would hand out a fresh (empty)
    connection to each caller.
    """
    eng = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture(scope="session")
def db_session(engine):
    """Session-scoped DB session — seed once, share across all tests."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    seed_database(session)
    yield session
    session.close()


@pytest.fixture(scope="session")
def client(engine, db_session):
    """
    FastAPI TestClient with the in-memory DB injected.

    We use TestClient(app, raise_server_exceptions=True) WITHOUT entering the
    lifespan context (lifespan=False) so the startup hook that seeds the real
    sound_design.db file is never triggered during tests.  The in-memory DB is
    already seeded by the db_session fixture above.
    """
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Convenience fixtures to look up seeded IDs ───────────────────────────────

@pytest.fixture(scope="session")
def all_components(db_session):
    return db_session.query(Component).all()


@pytest.fixture(scope="session")
def amp_d80(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "D80")
        .first()
    )


@pytest.fixture(scope="session")
def amp_la12x(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "LA12X")
        .first()
    )


@pytest.fixture(scope="session")
def amp_fp14000(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "FP14000")
        .first()
    )


@pytest.fixture(scope="session")
def amp_plx3602(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "PLX3602")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_v8(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "V8")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_vsub(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "V-SUB")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_evo6(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "EVO 6")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_f221(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "F221")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_ks28(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "KS28")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_leopard(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "LEOPARD")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_sh96(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "SH96")
        .first()
    )


@pytest.fixture(scope="session")
def speaker_th118(db_session):
    return (
        db_session.query(Component)
        .filter(Component.model_number == "TH118")
        .first()
    )
