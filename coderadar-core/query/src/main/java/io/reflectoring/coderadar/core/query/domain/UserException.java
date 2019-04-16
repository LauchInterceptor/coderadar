package io.reflectoring.coderadar.core.query.domain;

/** An exception whose message is supposed to be displayed to the user. */
public class UserException extends RuntimeException {

  public UserException(String message) {
    super(message);
  }
}
