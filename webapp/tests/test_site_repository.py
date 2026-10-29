from flask import current_app
from sqlalchemy import delete

from webapp import create_app
from webapp.models import Project, Webpage, WebpageStatus, db
from webapp.site_repository import SiteRepository


def test_initialize_site_repository():
    app = create_app()
    site_repository = SiteRepository(
        "ubuntu.com",
        app,
    )
    assert site_repository.repository_uri == "ubuntu.com"


def test_delete_removed_webpages(db_session):
    """Pages missing from the repository scan are reconciled away."""
    project = Project(name="reconcile-test.com")
    db_session.add(project)
    db_session.commit()

    root = Webpage(
        name="/",
        url="/",
        project_id=project.id,
        status=WebpageStatus.AVAILABLE,
    )
    db_session.add(root)
    db_session.commit()

    kept = Webpage(
        name="/kept",
        url="/kept",
        project_id=project.id,
        parent_id=root.id,
        status=WebpageStatus.AVAILABLE,
    )
    removed = Webpage(
        name="/removed",
        url="/removed",
        project_id=project.id,
        parent_id=root.id,
        status=WebpageStatus.AVAILABLE,
    )
    # A page whose removal request already landed upstream
    deleted_upstream = Webpage(
        name="/deleted-upstream",
        url="/deleted-upstream",
        project_id=project.id,
        parent_id=root.id,
        status=WebpageStatus.TO_DELETE,
    )
    db_session.add_all([kept, removed, deleted_upstream])
    db_session.commit()

    # Only exists in this tool, so it must survive even though its parent
    # was removed upstream
    pending = Webpage(
        name="/removed/pending",
        url="/removed/pending",
        project_id=project.id,
        parent_id=removed.id,
        status=WebpageStatus.NEW,
    )
    db_session.add(pending)
    db_session.commit()

    site_repository = SiteRepository(
        "reconcile-test.com",
        current_app._get_current_object(),
        db=db,
    )
    site_repository.__delete_removed_webpages__(
        db,
        project.id,
        {"/", "/kept"},
    )
    db_session.commit()

    remaining = {
        webpage.name: webpage
        for webpage in Webpage.query.filter_by(project_id=project.id).all()
    }

    assert set(remaining) == {"/", "/kept", "/removed/pending"}
    assert remaining["/removed/pending"].parent_id == root.id

    # A single statement keeps the self-referential foreign key satisfied
    db_session.execute(
        delete(Webpage).where(Webpage.project_id == project.id),
    )
    db_session.delete(project)
    db_session.commit()
