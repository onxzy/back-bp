class CustomError extends Error {
  constructor(msg = '') {
    super(msg);
    this.name = this.constructor.name;
  }
}

export class ChatNotFoundError extends CustomError {}
export class WrongChatTypeError extends CustomError {}

export class EmptyMembersToAddError extends CustomError {}
export class EmptyNewMembersError extends CustomError {}
export class MemberNotInChat extends CustomError {}

export class CreatePrivateWithSelfError extends CustomError {}
export class MultiplePrivateWithUserError extends CustomError {}
export class MoreThan2InPrivateError extends CustomError {}

export class RepliedIdNotFound extends CustomError {}
