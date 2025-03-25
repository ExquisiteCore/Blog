use tower_http::{
    classify::{ServerErrorsAsFailures, SharedClassifier},
    trace::{self, TraceLayer},
};
use tracing::Level;

pub fn create_layer() -> TraceLayer<SharedClassifier<ServerErrorsAsFailures>> {
    let trace_layer = TraceLayer::new_for_http()
        .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
        .on_request(trace::DefaultOnRequest::new().level(Level::INFO))
        .on_response(trace::DefaultOnResponse::new().level(Level::INFO));

    trace_layer
}
