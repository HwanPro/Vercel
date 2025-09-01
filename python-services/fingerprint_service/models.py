from sqlalchemy import Column, String, DateTime, Text, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True)
    phoneNumber = Column(String, unique=True)
    firstName = Column(String)
    lastName = Column(String)

    # Relación con huellas (múltiples huellas por usuario)
    fingerprints = relationship("Fingerprint", back_populates="user", cascade="all, delete-orphan")

class Fingerprint(Base):
    __tablename__ = "Fingerprint"  # Prisma crea esta tabla con este nombre

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    template = Column(Text, nullable=False)
    createdAt = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="fingerprints")
