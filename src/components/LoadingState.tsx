interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "ロード中...",
}) => {
  return <p>{message}</p>;
};

export default LoadingState;
