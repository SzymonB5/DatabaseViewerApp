package project.BackEnd.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserInfoServiceImpl implements UserInfoService {

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Override
    public UserInfo saveUsers(UserInfo userInfo) {
        return userInfoRepository.save(userInfo);
    }

    @Override
    public List<UserInfo> getAllUsers() {
        return userInfoRepository.findAll();
    }

    @Override
    public UserInfo getUsersByUsername(String username) {
        return userInfoRepository.findByUsername(username);
    }

    @Override
    public boolean checkExistenceByUsername(String username) {
        return userInfoRepository.findByUsername(username) != null;
    }

    @Override
    public Long getIdByUsername(String username) {
        return userInfoRepository.findByUsername(username).getId();
    }

}
