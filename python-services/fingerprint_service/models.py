from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, func
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
    __tablename__ = "fingerprints"  # Nombre real en Prisma

    id = Column(String, primary_key=True)
    user_id = Column("user_id", String, ForeignKey("users.id"), index=True, nullable=False)
    finger_index = Column("finger_index", Integer, default=0, nullable=False)
    template = Column(Text, nullable=False)
    created_at = Column("created_at", DateTime, server_default=func.now())
    updated_at = Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now())

    # Compatibilidad con código antiguo
    @property
    def userId(self):
        return self.user_id
    
    @userId.setter
    def userId(self, value):
        self.user_id = value
    
    @property
    def fingerIndex(self):
        return self.finger_index
    
    @fingerIndex.setter
    def fingerIndex(self, value):
        self.finger_index = value

    user = relationship("User", back_populates="fingerprints")
