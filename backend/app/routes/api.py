from fastapi import APIRouter
from app.routes import tasks, boards, quadros, grupos

router = APIRouter()

router.include_router(tasks.router)
router.include_router(boards.router)
router.include_router(quadros.router)
router.include_router(grupos.router)
