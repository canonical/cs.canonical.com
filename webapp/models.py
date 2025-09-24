import enum
from datetime import datetime, timezone

import yaml
from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    relationship,
    scoped_session,
    sessionmaker,
)
from sqlalchemy.orm.session import Session

with open("data/data.yaml") as file:
    data = yaml.load(file, Loader=yaml.FullLoader)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base, engine_options={"poolclass": None})


def get_or_create(session: Session, model: Base, commit=True, **kwargs):
    """Return an instance of the specified model if it exists, otherwise create
    a new instance.

    :param session: The database session to use for querying and committing
        changes.
    :param model: The model class to query and create instances of.
    :param kwargs: The filter criteria used to query the database for an
        existing instance.
    :return: An instance of the specified model.
    """
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    instance = model(**kwargs)
    session.add(instance)
    # Allow adding multiple instances before committing
    if commit:
        session.commit()
    return instance, True


class DateTimeMixin:
    created_at: Mapped[datetime] = Column(
        DateTime,
        default=datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = Column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )


class WebpageStatus(enum.Enum):
    NEW = "NEW"
    TO_DELETE = "TO_DELETE"
    AVAILABLE = "AVAILABLE"


class Project(db.Model, DateTimeMixin):
    __tablename__ = "projects"

    id: int = Column(Integer, primary_key=True)
    name: str = Column(String, nullable=False)
    webpages = relationship("Webpage", back_populates="project")


class Webpage(db.Model, DateTimeMixin):
    __tablename__ = "webpages"

    id: int = Column(Integer, primary_key=True)
    project_id: int = Column(Integer, ForeignKey("projects.id"))
    name: str = Column(String, nullable=False)
    url: str = Column(String, nullable=False)
    title: str = Column(String)
    description: str = Column(String)
    copy_doc_link: str = Column(String)
    parent_id: int = Column(Integer, ForeignKey("webpages.id"))
    owner_id: int = Column(Integer, ForeignKey("users.id"))
    status: str = Column(Enum(WebpageStatus), default=WebpageStatus.AVAILABLE)
    ext: str = Column(String, nullable=True)
    content_jira_id: str = Column(String, nullable=True)  # This field is used
    # to track which pages were created from the content team's board on Jira
    file_path: str = Column(String, nullable=True)

    project = relationship("Project", back_populates="webpages")
    owner = relationship("User", back_populates="webpages")
    reviewers = relationship("Reviewer", back_populates="webpages")
    jira_tasks = relationship(
        "JiraTask",
        back_populates="webpages",
        order_by="desc(JiraTask.created_at)",
    )
    webpage_products = relationship(
        "WebpageProduct",
        back_populates="webpages",
    )
    # Relationship to assets via association table
    assets = relationship(
        "Asset",
        secondary="webpage_assets",
        back_populates="webpages",
    )


class User(db.Model, DateTimeMixin):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True)
    name: str = Column(String, nullable=False)
    email: str = Column(String)
    jira_account_id: str = Column(String)
    team: str = Column(String)
    department: str = Column(String)
    hrc_id: int = Column(Integer)
    job_title: str = Column(String)
    role: str = Column(String)

    webpages = relationship("Webpage", back_populates="owner")
    reviewers = relationship("Reviewer", back_populates="user")
    jira_tasks = relationship("JiraTask", back_populates="user")


class Reviewer(db.Model, DateTimeMixin):
    __tablename__ = "reviewers"

    id: int = Column(Integer, primary_key=True)
    user_id: int = Column(Integer, ForeignKey("users.id"))
    webpage_id: int = Column(Integer, ForeignKey("webpages.id"))

    user = relationship("User", back_populates="reviewers")
    webpages = relationship("Webpage", back_populates="reviewers")


class JIRATaskStatus:
    TRIAGED = "TRIAGED"
    UNTRIAGED = "UNTRIAGED"
    BLOCKED = "BLOCKED"
    IN_PROGRESS = "IN PROGRESS"
    TO_BE_DEPLOYED = "TO BE DEPLOYED"
    DONE = "DONE"
    REJECTED = "REJECTED"


class JiraTaskType:
    COPY_UPDATE = "COPY_UPDATE"
    PAGE_REFRESH = "PAGE_REFRESH"
    PAGE_REMOVAL = "PAGE_REMOVAL"


class JiraTask(db.Model, DateTimeMixin):
    __tablename__ = "jira_tasks"

    id: int = Column(Integer, primary_key=True)
    jira_id: str = Column(String)
    webpage_id: int = Column(Integer, ForeignKey("webpages.id"))
    user_id: int = Column(Integer, ForeignKey("users.id"))
    status: str = Column(String, default=JIRATaskStatus.UNTRIAGED)
    summary: str = Column(String)
    request_type: str = Column(String)

    webpages = relationship("Webpage", back_populates="jira_tasks")
    user = relationship("User", back_populates="jira_tasks")


class Product(db.Model, DateTimeMixin):
    __tablename__ = "products"

    id: int = Column(Integer, primary_key=True)
    slug: str = Column(String, unique=True)
    name: str = Column(String)

    webpage_products = relationship(
        "WebpageProduct",
        back_populates="products",
        cascade="all, delete-orphan",
    )


class WebpageProduct(db.Model, DateTimeMixin):
    __tablename__ = "webpage_products"

    id: int = Column(Integer, primary_key=True)
    webpage_id: int = Column(Integer, ForeignKey("webpages.id"))
    product_id: int = Column(Integer, ForeignKey("products.id"))

    webpages = relationship("Webpage", back_populates="webpage_products")
    products = relationship("Product", back_populates="webpage_products")


class Asset(db.Model, DateTimeMixin):
    __tablename__ = "assets"

    id: int = Column(Integer, primary_key=True)
    type: str = Column(String, nullable=False)
    url: str = Column(String, nullable=False)

    # Relationship to webpages via association table
    webpages = relationship(
        "Webpage",
        secondary="webpage_assets",
        back_populates="assets",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "url": self.url,
        }


class WebpageAsset(db.Model, DateTimeMixin):
    __tablename__ = "webpage_assets"

    __table_args__ = (
        db.UniqueConstraint("webpage_id", "asset_id", name="uq_webpage_asset"),
    )

    id = Column(Integer, primary_key=True)
    webpage_id = Column(Integer, ForeignKey("webpages.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)


def init_db(app: Flask):
    engine = create_engine(
        app.config["SQLALCHEMY_DATABASE_URI"],
        pool_timeout=30,
        pool_recycle=3600,
        pool_size=10,
        pool_pre_ping=True,
    )
    session_factory = sessionmaker(bind=engine)

    db.init_app(app)
    Migrate(app, db)

    @app.before_request
    def before_request():
        scoped_session(session_factory)

    @app.teardown_request
    def teardown_request(exception):
        if exception:
            db.session.rollback()
        db.session.remove()

    # Create default project and user
    @app.before_request
    def create_default_project():
        app.before_request_funcs[None].remove(create_default_project)
        get_or_create(db.session, Project, name="Default")
        get_or_create(db.session, User, name="Default")

    # Pre-populate product data from YAML
    @app.before_request
    def create_products():
        app.before_request_funcs[None].remove(create_products)
        try:
            for product in data["products"]:
                get_or_create(
                    db.session,
                    Product,
                    slug=product["slug"],
                    name=product["name"],
                )
        except IntegrityError:
            pass
