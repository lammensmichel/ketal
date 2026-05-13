// Mock factory functions for circular dependencies (RoomService ↔ AuthService ↔ GameService)

export { createRoomServiceFactory, createAuthServiceFactory, createGameServiceFactory } from './test-helpers';
