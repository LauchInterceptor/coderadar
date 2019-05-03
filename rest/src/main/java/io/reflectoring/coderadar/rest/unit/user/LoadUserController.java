package io.reflectoring.coderadar.rest.unit.user;

import io.reflectoring.coderadar.core.projectadministration.port.driver.user.load.LoadUserResponse;
import io.reflectoring.coderadar.core.projectadministration.port.driver.user.load.LoadUserUseCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoadUserController {
  private final LoadUserUseCase loadUserUseCase;

  @Autowired
  public LoadUserController(LoadUserUseCase loadUserUseCase) {
    this.loadUserUseCase = loadUserUseCase;
  }

  @GetMapping(path = "/user/{userId}")
  public ResponseEntity<LoadUserResponse> loadUser(@PathVariable Long userId) {
    return new ResponseEntity<>(loadUserUseCase.loadUser(userId), HttpStatus.OK);
  }
}
