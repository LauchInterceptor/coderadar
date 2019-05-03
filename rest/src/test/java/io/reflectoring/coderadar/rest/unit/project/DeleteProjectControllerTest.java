package io.reflectoring.coderadar.rest.unit.project;

import io.reflectoring.coderadar.core.projectadministration.port.driver.project.delete.DeleteProjectUseCase;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
class DeleteProjectControllerTest {

  @Mock private DeleteProjectUseCase deleteProjectUseCase;
  @InjectMocks private DeleteProjectController testSubject;

  @Test
  void deleteProjectWithIdOne() {
    ResponseEntity<String> responseEntity = testSubject.deleteProject(1L);
    Mockito.verify(deleteProjectUseCase, Mockito.times(1)).delete(1L);

    Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
  }
}
