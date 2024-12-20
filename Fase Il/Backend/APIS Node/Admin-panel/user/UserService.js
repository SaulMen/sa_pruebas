const UserRepository = require('./userRepository');

class UserService {
    async createUser(data) {
        return await UserRepository.createUser(data);
    }

    async getUserById(id) {
        const user = await UserRepository.findUserById(id);
        if (!user) throw new Error("Usuario no encontrado");
        return user;
    }

    async updateUser(id, data) {
        await this.getUserById(id); 
        return await UserRepository.updateUser(id, data);
    }

    async deleteUser(id) {
        await this.getUserById(id); 
        return await UserRepository.deleteUser(id);
    }

    async getAllUsers() {
        return await UserRepository.findAllUsers();
    }
}

module.exports = new UserService();
